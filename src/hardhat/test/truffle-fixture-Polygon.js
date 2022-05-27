const { ethers, upgrades } = require("hardhat");
const path = require('path');
const envPath = path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath });
const hre = require("hardhat");
const BigNumber = require('bignumber.js');
const chalk = require('chalk');
const constants = require(path.join(__dirname, '../../../dist/types/constants'));

// Core
const polyFRAX = artifacts.require("ERC20/__CROSSCHAIN/polyFRAX");
const polyFXS = artifacts.require("ERC20/__CROSSCHAIN/polyFXS");
const polyUSDC = artifacts.require("ERC20/__CROSSCHAIN/polyUSDC");
// const IChildChainManager = artifacts.require("ERC20/__CROSSCHAIN/IChildChainManager");
const CrossChainCanonicalFRAX = artifacts.require("ERC20/__CROSSCHAIN/CrossChainCanonicalFRAX");
const CrossChainCanonicalFXS = artifacts.require("ERC20/__CROSSCHAIN/CrossChainCanonicalFXS");

// FPI
const FPI = artifacts.require("FPI/FPI");
const FPIS = artifacts.require("FPI/FPIS");
const FPIControllerPool = artifacts.require("FPI/FPIControllerPool.sol");

// Bridges
const CrossChainBridgeBacker_POLY_MaticBridge = artifacts.require("Bridges/Polygon/CrossChainBridgeBacker_POLY_MaticBridge");

// Oracles
const CPITrackerOracle = artifacts.require("Oracle/CPITrackerOracle");
const CrossChainOracle = artifacts.require("Oracle/CrossChainOracle");

// Staking contracts
const FraxCrossChainFarm_FRAX_mUSD = artifacts.require("Staking/Variants/FraxCrossChainFarm_FRAX_mUSD");

// TWAMM
const UniV2TWAMMFactory = artifacts.require("Fraxswap/core/FraxswapFactory");
const UniV2TWAMMPair = artifacts.require("Fraxswap/core/FraxswapPair");
const UniV2TWAMMRouter = artifacts.require("Fraxswap/periphery/FraxswapRouter");

// AMOs
const MarketXYZLendingAMO = artifacts.require("Misc_AMOs/__CROSSCHAIN/Polygon/MarketXYZLendingAMO.sol");
const SushiSwapLiquidityAMO_POLY = artifacts.require("Misc_AMOs/__CROSSCHAIN/Polygon/SushiSwapLiquidityAMO_POLY.sol");

module.exports = async (deployer) => {
    const THE_ACCOUNTS = await hre.web3.eth.getAccounts();
    console.log("THE_ACCOUNTS[0] in truffle-fixture: ", THE_ACCOUNTS[0]);

    // Get the necessary instances
	let CONTRACT_ADDRESSES;

    // Core
    let polyFRAX_instance;
    let polyFXS_instance;
    let polyUSDC_instance;
    let child_chain_manager_instance;
    let cross_chain_canonical_frax_instance;
    let cross_chain_canonical_fxs_instance;

    // FPI
    let fpi_instance;
    let fpis_instance;
    let fpi_controller_pool_instance;

    // Bridges
    let cross_chain_bridge_backer_instance;

    // Oracles
    let cpi_tracker_oracle_instance;
    let cross_chain_oracle_instance;
    
	// Staking
    let staking_instance_frax_musd;

    // TWAMM
    let fraxswap_factory_instance;
    let twamm_pair_instance;
    let fraxswap_router_instance;

    // AMO
    let market_xyz_lending_instance;
    let sushiswap_liquidity_instance;
    
    // Assign live contract addresses
    CONTRACT_ADDRESSES = constants.CONTRACT_ADDRESSES;

    // Core
    polyFRAX_instance = await polyFRAX.at(CONTRACT_ADDRESSES.polygon.bridge_tokens.polyFRAX);
    polyFXS_instance = await polyFXS.at(CONTRACT_ADDRESSES.polygon.bridge_tokens.polyFXS);
    polyUSDC_instance = await polyUSDC.at(CONTRACT_ADDRESSES.polygon.collaterals.polyUSDC);
    // child_chain_manager_instance = await IChildChainManager.at("0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa");
    cross_chain_canonical_frax_instance = await CrossChainCanonicalFRAX.at(CONTRACT_ADDRESSES.polygon.canonicals.FRAX);
    cross_chain_canonical_fxs_instance = await CrossChainCanonicalFXS.at(CONTRACT_ADDRESSES.polygon.canonicals.FXS);

    // FPI
    fpi_instance = await FPI.at(CONTRACT_ADDRESSES.polygon.canonicals.FPI);
    fpis_instance = await FPIS.at(CONTRACT_ADDRESSES.polygon.canonicals.FPIS);
    // fpi_controller_pool_instance = await FPIControllerPool.at(CONTRACT_ADDRESSES.polygon.amos.fpi_controller_amo);

    // Bridges
    cross_chain_bridge_backer_instance = await CrossChainBridgeBacker_POLY_MaticBridge.at(CONTRACT_ADDRESSES.polygon.bridge_backers.matic_bridge);

    // Oracles
    // cpi_tracker_oracle_instance = await CPITrackerOracle.at(CONTRACT_ADDRESSES.polygon.oracles_other.cpi_tracker_oracle); 
    cross_chain_oracle_instance = await CrossChainOracle.at(CONTRACT_ADDRESSES.polygon.oracles.cross_chain_oracle); 
 
    // Staking
    staking_instance_frax_musd = await FraxCrossChainFarm_FRAX_mUSD.at(CONTRACT_ADDRESSES.polygon.staking_contracts["mStable FRAX/mUSD"]);

    // TWAMM
    // fraxswap_factory_instance = await UniV2TWAMMFactory.at(CONTRACT_ADDRESSES.polygon.uniswap.fraxswap_factory);
    // twamm_pair_instance = await UniV2TWAMMPair.at(CONTRACT_ADDRESSES.polygon.pair_tokens["Fraxswap FRAX/FPI"]);
    // fraxswap_router_instance = await UniV2TWAMMRouter.at(CONTRACT_ADDRESSES.polygon.uniswap.fraxswap_router);

    // AMOs
    // fpi_controller_pool_instance = await FPIControllerPool.at(CONTRACT_ADDRESSES.polygon.amos.fpi_controller_amo);
    // market_xyz_lending_instance = await MarketXYZLendingAMO.at(CONTRACT_ADDRESSES.polygon.amos.market_xyz_liquidity);
    sushiswap_liquidity_instance = await SushiSwapLiquidityAMO_POLY.at(CONTRACT_ADDRESSES.polygon.amos.sushiswap_liquidity);

    // ANY NEW CONTRACTS, PUT BELOW HERE
    // .new() calls and deployments
    // ==========================================================================

    console.log(chalk.yellow("========== FraxswapFactory =========="));
    fraxswap_factory_instance = await UniV2TWAMMFactory.new( 
        THE_ACCOUNTS[1],
    );

    console.log(chalk.yellow("========== FraxswapRouter =========="));
    fraxswap_router_instance = await UniV2TWAMMRouter.new( 
        fraxswap_factory_instance.address,
        CONTRACT_ADDRESSES.polygon.reward_tokens.wmatic
    );

    console.log(chalk.yellow("========== CPITrackerOracle =========="));
    cpi_tracker_oracle_instance = await CPITrackerOracle.new( 
        THE_ACCOUNTS[1],
        "0x0000000000000000000000000000000000000000"
    );

    // Create the FRAX/FPI LP Pair
    const seed_amt = BIG18.mul(10);
    await fpi_instance.approve(fraxswap_router_instance.address, seed_amt, { from: THE_ACCOUNTS[1] });
    await cross_chain_canonical_frax_instance.approve(fraxswap_router_instance.address, seed_amt, { from: THE_ACCOUNTS[1] });
    await fraxswap_router_instance.addLiquidity(
        fpi_instance.address, 
        cross_chain_canonical_frax_instance.address, 
        seed_amt, 
        seed_amt, 
        0, 
        0, 
        THE_ACCOUNTS[1], 
        1999999999
    );

    console.log(chalk.yellow("========== FraxswapPair =========="));
    const lpAddress = await fraxswap_factory_instance.getPair(fpi_instance.address, cross_chain_canonical_frax_instance.address);
    console.log("FRAX/FPI LP deployed to: ", lpAddress)
    twamm_pair_instance = await UniV2TWAMMPair.at(lpAddress);

    console.log(chalk.yellow("========== FPIControllerPool =========="));
    fpi_controller_pool_instance = await FPIControllerPool.new( 
        THE_ACCOUNTS[1], 
        "0x0000000000000000000000000000000000000000",
        [
            cross_chain_canonical_frax_instance.address,
            fpi_instance.address,
            lpAddress,
            "0xBaC409D670d996Ef852056f6d45eCA41A8D57FbD", // fantom CHAINLINK FRAX
            "0x2553f4eeb82d5A26427b8d1106C51499CBa5D99c", // fantom CHAINLINK USDC [PLACEHOLDER UNTIL FPI ORACLE IS UP]
            cpi_tracker_oracle_instance.address,
            "0x0000000000000000000000000000000000000000"
        ]
    );

    // console.log(chalk.yellow('========== CrossChainBridgeBacker_POLY_MaticBridge =========='));
    // // CrossChainBridgeBacker_POLY_MaticBridge
    // cross_chain_bridge_backer_instance = await CrossChainBridgeBacker_POLY_MaticBridge.new(
    //     THE_ACCOUNTS[1],
    //     CONTRACT_ADDRESSES.ethereum.misc.timelock,
    //     CONTRACT_ADDRESSES.polygon.oracles.cross_chain_oracle,
    //     [
    //         CONTRACT_ADDRESSES.polygon.bridge_tokens.polyFRAX, // polyFRAX
    //         CONTRACT_ADDRESSES.polygon.canonicals.FRAX, // canFRAX
    //         CONTRACT_ADDRESSES.polygon.bridge_tokens.polyFXS, // polyFXS
    //         CONTRACT_ADDRESSES.polygon.canonicals.FXS, // canFXS
    //         CONTRACT_ADDRESSES.polygon.collaterals.polyUSDC // polyUSDC
    //     ],
    //     [
    //         CONTRACT_ADDRESSES.polygon.bridges.polyFRAX, // IUChildERC20 withdraw
    //         CONTRACT_ADDRESSES.polygon.bridges.polyFXS, // IUChildERC20 withdraw
    //         CONTRACT_ADDRESSES.polygon.bridges.polyUSDC // IUChildERC20 withdraw
    //     ],
    //     "0x0000000000000000000000000000000000000000", // Polygon goes to same address on other side
    //     "",
    //     "FRAX Polygon MaticBridge CrossChainBridgeBacker",
    // );


    // console.log(chalk.yellow("========== MarketXYZLendingAMO =========="));
    // market_xyz_lending_instance = await MarketXYZLendingAMO.new(
    //     THE_ACCOUNTS[1],
    //     [
    //         "", // Pool #2: [Unitroller] Index Coop Pool.
    //     ],
    //     [
    //         "", // Pool #2: [CErc20Delegator] Index Coop Pool.
    //     ],
    //     cross_chain_bridge_backer_instance.address
    // );

    // console.log(chalk.yellow("========== SushiSwapLiquidityAMO_POLY =========="));
    // sushiswap_liquidity_instance = await SushiSwapLiquidityAMO_POLY.new(
    //     THE_ACCOUNTS[1],
    //     THE_ACCOUNTS[10],
    //     cross_chain_canonical_frax_instance.address,
    //     cross_chain_canonical_fxs_instance.address,
    //     CONTRACT_ADDRESSES.polygon.collaterals.polyUSDC,
    //     cross_chain_bridge_backer_instance.address,
    //     [
	// 		CONTRACT_ADDRESSES.polygon.pair_tokens["Sushi canFRAX/canFXS"],
	// 		CONTRACT_ADDRESSES.polygon.pair_tokens["Sushi canFRAX/polyUSDC"],
	// 		CONTRACT_ADDRESSES.polygon.pair_tokens["Sushi canFXS/polyUSDC"],
	// 	]
    // );
    
    // ----------------------------------------------
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [process.env.POLYGON_ONE_ADDRESS]
    });    

    // console.log(chalk.yellow('========== WHITELIST AMOS FOR CrossChainBridgeBacker_POLY_MaticBridge =========='));
    // await cross_chain_bridge_backer_instance.addAMO(sushiswap_liquidity_instance.address, false, { from: THE_ACCOUNTS[1] });

    await hre.network.provider.request({
        method: "hardhat_stopImpersonatingAccount",
        params: [process.env.POLYGON_ONE_ADDRESS]
    });

    // ----------------------------------------------
    console.log(chalk.yellow('========== DEPLOY CONTRACTS =========='));

    console.log(chalk.yellow("--------DEPLOYING CORE CONTRACTS--------"));
    CrossChainCanonicalFRAX.setAsDeployed(cross_chain_canonical_frax_instance);
    CrossChainCanonicalFXS.setAsDeployed(cross_chain_canonical_fxs_instance);
    polyFRAX.setAsDeployed(polyFRAX_instance);
    polyFXS.setAsDeployed(polyFXS_instance);
    polyUSDC.setAsDeployed(polyUSDC_instance);

    console.log(chalk.yellow("--------DEPLOYING FPI CONTRACTS--------"));
    FPI.setAsDeployed(fpi_instance);
    FPIS.setAsDeployed(fpis_instance);
    FPIControllerPool.setAsDeployed(fpi_controller_pool_instance);

    console.log(chalk.yellow("--------DEPLOYING BRIDGE CONTRACTS--------"));
    CrossChainBridgeBacker_POLY_MaticBridge.setAsDeployed(cross_chain_bridge_backer_instance);

    console.log(chalk.yellow("--------DEPLOYING ORACLE CONTRACTS--------"));
    CrossChainOracle.setAsDeployed(cross_chain_oracle_instance);
    CPITrackerOracle.setAsDeployed(cpi_tracker_oracle_instance);

    console.log(chalk.yellow("--------DEPLOYING STAKING CONTRACTS--------"));
    FraxCrossChainFarm_FRAX_mUSD.setAsDeployed(staking_instance_frax_musd);

    console.log(chalk.yellow("--------DEPLOYING TWAMM CONTRACTS--------"));
    UniV2TWAMMFactory.setAsDeployed(fraxswap_factory_instance);
    UniV2TWAMMPair.setAsDeployed(twamm_pair_instance);
    UniV2TWAMMRouter.setAsDeployed(fraxswap_router_instance);

    console.log(chalk.yellow("--------DEPLOYING AMO CONTRACTS--------"));
    FPIControllerPool.setAsDeployed(fpi_controller_pool_instance);
    // MarketXYZLendingAMO.setAsDeployed(market_xyz_lending_instance);
    SushiSwapLiquidityAMO_POLY.setAsDeployed(sushiswap_liquidity_instance);

    console.log(chalk.yellow("--------DEPLOYING MISC CONTRACTS--------"));


}