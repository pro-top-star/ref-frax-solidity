const {expect} = require("chai");
const {ethers} = require("hardhat");
const UniV2TWAMMPair = require('../../artifacts/contracts/Fraxswap/core/FraxswapPair.sol/FraxswapPair');
const {bigNumberify, expandTo18Decimals} = require('./utilities');
const {calculateTwammExpected} = require('./twamm-utils')

async function getBlockTimestamp() {
    return (await ethers.provider.getBlock("latest")).timestamp
}

function outputErrorDiffPct(A, B) {
    const bigger = A > B ? A : B;
    const smaller = A < B ? A : B;
    return `diff: ${ethers.utils.formatUnits(bigger.mul(10000).div(smaller).sub(10000), 2)} %`
}

function outputRatio(A, B) {
    return ethers.utils.formatUnits(A.mul(10000).div(B), 4)
}

const allTwammTests = (multiplier) => describe(`TWAMM - swap multiplier: ${multiplier} longterm swap ratio: ${outputRatio(expandTo18Decimals(10 * multiplier), expandTo18Decimals(100000))}`, function () {

    let tokenA;
    let tokenB;

    let twamm;

    let owner;
    let addr1;
    let addr2;
    let addrs;

    const blockInterval = 10;

    const initialLiquidityProvided0 = expandTo18Decimals(1000000000);
    const initialLiquidityProvided1 = 1000000000;
    const ERC20Supply = expandTo18Decimals(100000000000000);

    describe("TWAMM Functionality ", function () {

        beforeEach(async function () {

            [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

            let setupCnt = await setupContracts(true);
            tokenA = setupCnt.token0;
            tokenB = setupCnt.token1;
            factory = setupCnt.factory;
            twamm = setupCnt.pair;

            tokenA.approve(twamm.address, ERC20Supply);
            tokenB.approve(twamm.address, ERC20Supply);

            //provide initial liquidity
            await tokenA.transfer(twamm.address, initialLiquidityProvided0)
            await tokenB.transfer(twamm.address, initialLiquidityProvided1)
            await twamm.mint(owner.address)
        });

        describe("Long term swaps", function () {

            it("Single sided long term order behaves like normal swap", async function () {

                const amountInA = expandTo18Decimals(10 * multiplier);
                await tokenA.transfer(addr1.address, amountInA);

                const amountInAMinusFee = amountInA.mul(997).div(1000)

                //expected output
                let tokenAReserve, tokenBReserve;
                [tokenAReserve, tokenBReserve] = await twamm.getReserves();
                const expectedOut =
                    tokenBReserve
                        .mul(amountInAMinusFee)
                        .div(tokenAReserve.add(amountInAMinusFee));

                //trigger long term order
                await tokenA.connect(addr1).approve(twamm.address, amountInA);
                await twamm.connect(addr1).longTermSwapFrom0To1(amountInA, 10)

                await mineTimeIntervals(11)
                await twamm.connect(addr1).executeVirtualOrders(await getBlockTimestamp() + 1);

                //withdraw proceeds
                const beforeBalanceB = await tokenB.balanceOf(addr1.address);
                await twamm.connect(addr1).withdrawProceedsFromLongTermSwap(0);
                const afterBalanceB = await tokenB.balanceOf(addr1.address);
                const actualOutput = afterBalanceB.sub(beforeBalanceB);

                console.log("actualOutput:" + actualOutput);
                console.log("expectedOut :" + expectedOut)

                //since we are breaking up order, match is not exact
                expect(actualOutput).to.be.closeTo(expectedOut, expectedOut.mul(1).div(100));

            });
        });
    });


    async function setupContracts(createPair = true) {
        const [owner, user1, user2, user3] = await ethers.getSigners();

        // Deploy token0/token1 token and distribute
        const DummyToken = await ethers.getContractFactory("contracts/Fraxswap/periphery/test/ERC20PeriTest.sol:ERC20PeriTest");
        let token0 = await DummyToken.deploy(ERC20Supply);
        let token1 = await DummyToken.deploy(ERC20Supply);
        const weth9 = await (await ethers.getContractFactory("WETH9")).deploy();

        if (token1.address.toUpperCase() < token0.address.toUpperCase()) {
            var temp = token1;
            token1 = token0;
            token0 = temp;
        }

        const FraxswapFactory = await ethers.getContractFactory("FraxswapFactory");
        const factory = await FraxswapFactory.deploy(owner.address);
        await factory.deployed();

        let pair;
        if (createPair) {
            await factory.createPair(token0.address, token1.address);
            const pairAddress = await factory.getPair(token0.address, token1.address);
            pair = new ethers.Contract(pairAddress, UniV2TWAMMPair.abi).connect(owner);
        }

        const FraxswapRouter = await ethers.getContractFactory("FraxswapRouter");
        const router = await FraxswapRouter.deploy(factory.address, weth9.address);
        await router.deployed();

        return {
            token0,
            token1,
            weth9,
            factory,
            pair,
            router
        }
    }
});

describe("Multiple TWAMM Tests", function () {
    allTwammTests(1)
    allTwammTests(10)
    allTwammTests(100)
    allTwammTests(1000)
    allTwammTests(2000)
    allTwammTests(3000)
})

let orderTimeInterval = 3600;
async function mineTimeIntervals(timeIntervals) {

    // use this when it's ready from hardhat: https://github.com/NomicFoundation/hardhat/issues/1998#issuecomment-1046824743
    // await network.provider.send("hardhat_mine", [timeIntervals, 3600])

    let currTime = await getBlockTimestamp();
    const targetTime = currTime + (orderTimeInterval * timeIntervals);
    // mine blocks until targetTime is reached
    while (currTime <= targetTime) {
        // mine blocks as half orderTimeInterval
        await network.provider.send("evm_increaseTime", [parseInt(`${orderTimeInterval / 2}`)]);
        await network.provider.send("evm_mine");
        currTime = await getBlockTimestamp();
    }
}
