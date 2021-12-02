const path = require('path');
const envPath = path.join(__dirname, '../../../.env');
require('dotenv').config({ path: envPath });

const BigNumber = require('bignumber.js');
const util = require('util');
const chalk = require('chalk');
const Contract = require('web3-eth-contract');
const { expectRevert, time } = require('@openzeppelin/test-helpers');

const constants = require(path.join(__dirname, '../../../../dist/types/constants'));
const utilities = require(path.join(__dirname, '../../../../dist/misc/utilities'));

// Set provider for all later instances to use
Contract.setProvider('http://127.0.0.1:7545');

global.artifacts = artifacts;
global.web3 = web3;

const hre = require("hardhat");
const e = require('express');

// Core

const oneFRAX = artifacts.require("ERC20/__CROSSCHAIN/oneFRAX");
const oneFXS = artifacts.require("ERC20/__CROSSCHAIN/oneFXS");
const CrossChainCanonicalFRAX = artifacts.require("ERC20/__CROSSCHAIN/CrossChainCanonicalFRAX");
const CrossChainCanonicalFXS = artifacts.require("ERC20/__CROSSCHAIN/CrossChainCanonicalFXS");

// Collateral
const oneUSDC = artifacts.require("ERC20/__CROSSCHAIN/oneUSDC");

// Bridges
const CrossChainBridgeBacker_HARM_Horizon = artifacts.require("Bridges/Harmony/CrossChainBridgeBacker_HARM_Horizon");

// Oracles
const CrossChainOracle = artifacts.require("Oracle/CrossChainOracle");

// Staking

// AMOs
const SushiSwapLiquidityAMO_HARM = artifacts.require("Misc_AMOs/__CROSSCHAIN/Harmony/SushiSwapLiquidityAMO_HARM.sol");

// Constants
const BIG2 = new BigNumber("1e2");
const BIG6 = new BigNumber("1e6");
const BIG9 = new BigNumber("1e9");
const BIG12 = new BigNumber("1e12");
const BIG18 = new BigNumber("1e18");
const TIMELOCK_DELAY = 86400 * 2; // 2 days
const DUMP_ADDRESS = "0x6666666666666666666666666666666666666666";
const METAMASK_ADDRESS = "0x6A24A4EcA5Ed225CeaE6895e071a74344E2853F5";
const METAPOOL_ADDRESS = "0xC7E0ABfe4e0278af66F69C93CD3fD6810198b15B"; // hard-coded from deployment, can break

contract('CrossChainBridgeBacker_HARM_Horizon-Tests', async (accounts) => {
	CONTRACT_ADDRESSES = constants.CONTRACT_ADDRESSES;

	// Account addresses
	let ORIGINAL_HARMONY_ONE_ADDRESS;
	let COLLATERAL_FRAX_AND_FXS_OWNER;
	let ORACLE_ADDRESS;
	let POOL_CREATOR;
	let TIMELOCK_ADMIN;
	let GOVERNOR_GUARDIAN_ADDRESS;
	let STAKING_OWNER;
	let STAKING_REWARDS_DISTRIBUTOR;
	let INVESTOR_CUSTODIAN_ADDRESS;
	let CROSS_CHAIN_CUSTODIAN_ADDRESS;
	let AMO_CUSTODIAN_ADDRESS;

	// Useful addresses
	const ADDRESS_WITH_oneFRAX = "0x69e0e2b3d523d3b247d798a49c3fa022a46dd6bd";
	const ADDRESS_WITH_oneFXS = "0x36a87d1e3200225f881488e4aeedf25303febcae";
	const ADDRESS_WITH_oneUSDC = "0x570d5b1c8fb697463fbce34c2771958d232aeb74";

	// Initialize core instances
	let oneFRAX_instance;
	let oneFXS_instance;
	let canFRAX_instance;
	let canFXS_instance;

	// Initialize collateral addresses
	let oneUSDC_instance;

	// Initialize child chain manager
	let child_chain_manager_instance;

	// Initialize bridge instances
	let cc_bridge_backer_instance;

	// Initialize oracle instances
	let cross_chain_oracle_instance;

	// Initialize staking instances
	let staking_instance_frax_musd;

	// Initialize AMO instances
    // let scream_amo_instance;
    let SushiSwapLiquidityAMO_HARM_instance;

    beforeEach(async() => {

		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: [process.env.HARMONY_ONE_ADDRESS]}
		);

		// Constants
		ORIGINAL_HARMONY_ONE_ADDRESS = process.env.HARMONY_ONE_ADDRESS;
		DEPLOYER_ADDRESS = accounts[0];
		COLLATERAL_FRAX_AND_FXS_OWNER = accounts[1];
		ORACLE_ADDRESS = accounts[2];
		POOL_CREATOR = accounts[3];
		TIMELOCK_ADMIN = accounts[4];
		GOVERNOR_GUARDIAN_ADDRESS = accounts[5];
		STAKING_OWNER = accounts[6];
		STAKING_REWARDS_DISTRIBUTOR = accounts[7];
		INVESTOR_CUSTODIAN_ADDRESS = accounts[8];
		CROSS_CHAIN_CUSTODIAN_ADDRESS = accounts[9]; 
		AMO_CUSTODIAN_ADDRESS = accounts[10]; 

		// Fill core contract instances
		oneFRAX_instance = await oneFRAX.deployed();
		oneFXS_instance = await oneFXS.deployed();
		canFRAX_instance = await CrossChainCanonicalFRAX.deployed();
		canFXS_instance = await CrossChainCanonicalFXS.deployed();

		// Fill collateral instances
		oneUSDC_instance = await oneUSDC.deployed();

		// Fill child chain manager
		// child_chain_manager_instance = await IChildChainManager.deployed();

		// Fill bridge instances
		cc_bridge_backer_instance = await CrossChainBridgeBacker_HARM_Horizon.deployed();

		// Fill oracle instances
		cross_chain_oracle_instance = await CrossChainOracle.deployed();

		// Fill staking instances
		// staking_instance_frax_musd = await FraxCrossChainFarm_FRAX_mUSD.deployed();
		
		// Fill AMO instances
		SushiSwapLiquidityAMO_HARM_instance = await SushiSwapLiquidityAMO_HARM.deployed();
	});
	
	afterEach(async() => {
		await hre.network.provider.request({
			method: "hardhat_stopImpersonatingAccount",
			params: [process.env.HARMONY_ONE_ADDRESS]}
		);
	})

	// MAIN TEST
	// ================================================================
	it("Main test", async () => {

		// ****************************************************************************************
		// ****************************************************************************************
		console.log(chalk.green("***********************Initialization*************************"));
		// ****************************************************************************************
		// ****************************************************************************************

		// ====================================================
		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: [ADDRESS_WITH_oneFRAX]
		});    

		console.log(chalk.yellow('========== GIVE COLLATERAL_FRAX_AND_FXS_OWNER SOME oneFRAX  =========='));
		await oneFRAX_instance.transfer(COLLATERAL_FRAX_AND_FXS_OWNER, new BigNumber("10000e18"), { from: ADDRESS_WITH_oneFRAX });

		await hre.network.provider.request({
			method: "hardhat_stopImpersonatingAccount",
			params: [ADDRESS_WITH_oneFRAX]
		});

		// ====================================================
		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: [ADDRESS_WITH_oneFXS]
		});    

		console.log(chalk.yellow('========== GIVE COLLATERAL_FRAX_AND_FXS_OWNER SOME oneFXS  =========='));
		await oneFXS_instance.transfer(COLLATERAL_FRAX_AND_FXS_OWNER, new BigNumber("1000e18"), { from: ADDRESS_WITH_oneFXS });

		await hre.network.provider.request({
			method: "hardhat_stopImpersonatingAccount",
			params: [ADDRESS_WITH_oneFXS]
		});

		// ====================================================
		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: [ADDRESS_WITH_oneUSDC]
		});    

		console.log(chalk.yellow('========== GIVE COLLATERAL_FRAX_AND_FXS_OWNER SOME oneUSDC  =========='));
		await oneUSDC_instance.transfer(COLLATERAL_FRAX_AND_FXS_OWNER, new BigNumber("10000e6"), { from: ADDRESS_WITH_oneUSDC });

		await hre.network.provider.request({
			method: "hardhat_stopImpersonatingAccount",
			params: [ADDRESS_WITH_oneUSDC]
		});

		// ====================================================

		// console.log(chalk.yellow('========== SET COLLATERAL_FRAX_AND_FXS_OWNER AS THE CrossChainBridgeBacker OWNER  =========='));
		// await cc_bridge_backer_instance.nominateNewOwner(COLLATERAL_FRAX_AND_FXS_OWNER, { from: process.env.HARMONY_ONE_ADDRESS });
	
		console.log(chalk.yellow('========== SET COLLATERAL_FRAX_AND_FXS_OWNER AS THE canFRAX OWNER  =========='));
		await canFRAX_instance.nominateNewOwner(COLLATERAL_FRAX_AND_FXS_OWNER, { from: process.env.HARMONY_ONE_ADDRESS });
	
		console.log(chalk.yellow('========== SET COLLATERAL_FRAX_AND_FXS_OWNER AS THE canFXS OWNER  =========='));
		await canFXS_instance.nominateNewOwner(COLLATERAL_FRAX_AND_FXS_OWNER, { from: process.env.HARMONY_ONE_ADDRESS });

		// console.log(chalk.yellow('========== SET COLLATERAL_FRAX_AND_FXS_OWNER AS THE SushiSwapLiquidityAMO_HARM OWNER  =========='));
		// await SushiSwapLiquidityAMO_HARM_instance.nominateNewOwner(COLLATERAL_FRAX_AND_FXS_OWNER, { from: process.env.HARMONY_ONE_ADDRESS });
	
		await hre.network.provider.request({
			method: "hardhat_stopImpersonatingAccount",
			params: [process.env.HARMONY_ONE_ADDRESS]
		});

		// Accept ownerships
		// await cc_bridge_backer_instance.acceptOwnership({ from: COLLATERAL_FRAX_AND_FXS_OWNER });
		await canFRAX_instance.acceptOwnership({ from: COLLATERAL_FRAX_AND_FXS_OWNER });
		await canFXS_instance.acceptOwnership({ from: COLLATERAL_FRAX_AND_FXS_OWNER });
		// await SushiSwapLiquidityAMO_HARM_instance.acceptOwnership({ from: COLLATERAL_FRAX_AND_FXS_OWNER });


		// ====================================================

		// ****************************************************************************************
		// ****************************************************************************************
		console.log(chalk.green("**************************MAIN CODE***************************"));
		// ****************************************************************************************
		// ****************************************************************************************
		console.log("----------------------------");


		console.log(chalk.hex("#ff8b3d").bold("=================INITIALIZE================"));
		
		console.log("Print some info");
		let the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		let the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, null);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, null);


		console.log(chalk.hex("#ff8b3d").bold("=================MINT canFRAX AND canFXS================"));

		console.log("Add GOVERNOR_GUARDIAN_ADDRESS as a minter for canFRAX and canFXS");
		await canFRAX_instance.addMinter(GOVERNOR_GUARDIAN_ADDRESS, { from: COLLATERAL_FRAX_AND_FXS_OWNER });
		await canFXS_instance.addMinter(GOVERNOR_GUARDIAN_ADDRESS, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Add the bridge backer as a minter for canFRAX and canFXS");
		await canFRAX_instance.addMinter(cc_bridge_backer_instance.address, { from: COLLATERAL_FRAX_AND_FXS_OWNER });
		await canFXS_instance.addMinter(cc_bridge_backer_instance.address, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Raise the mint caps");
		await canFRAX_instance.setMintCap(new BigNumber("1000000e18"), { from: COLLATERAL_FRAX_AND_FXS_OWNER });
		await canFXS_instance.setMintCap(new BigNumber("1000000e18"), { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Mint some canFRAX and canFXS");
		await canFRAX_instance.minter_mint(GOVERNOR_GUARDIAN_ADDRESS, new BigNumber("100000e18"), { from: GOVERNOR_GUARDIAN_ADDRESS });
		await canFXS_instance.minter_mint(GOVERNOR_GUARDIAN_ADDRESS, new BigNumber("100000e18"), { from: GOVERNOR_GUARDIAN_ADDRESS });

		console.log("Give the canFRAX and canFXS contracts some old tokens");
		await oneFRAX_instance.transfer(canFRAX_instance.address, new BigNumber("5000e18"), { from: COLLATERAL_FRAX_AND_FXS_OWNER });
		await oneFXS_instance.transfer(canFXS_instance.address, new BigNumber("5000e18"), { from: COLLATERAL_FRAX_AND_FXS_OWNER });


		console.log(chalk.hex("#ff8b3d").bold("=========================GIVE THE BRIDGE BACKER SOME canFRAX AND canFXS========================="));
		const initial_dump_amt_canToken = new BigNumber("200e18");
		console.log("initial_dump_amt_canToken: ", initial_dump_amt_canToken.div(BIG18).toNumber());

		console.log("Give the bridge backer some canFRAX and canFXS");
		await canFRAX_instance.transfer(cc_bridge_backer_instance.address, initial_dump_amt_canToken, { from: GOVERNOR_GUARDIAN_ADDRESS });
		await canFXS_instance.transfer(cc_bridge_backer_instance.address, initial_dump_amt_canToken, { from: GOVERNOR_GUARDIAN_ADDRESS });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);


		console.log(chalk.hex("#ff8b3d").bold("=========================DUMP IN SOME oneFRAX [SIMULATES BRIDGE]========================="));
		const dump_amt_oneFRAX = new BigNumber("125e18");
		console.log("dump_amt_oneFRAX: ", dump_amt_oneFRAX.div(BIG18).toNumber());

		await oneFRAX_instance.transfer(cc_bridge_backer_instance.address, dump_amt_oneFRAX, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);


		console.log(chalk.hex("#ff8b3d").bold("=========================DUMP IN SOME oneFXS [SIMULATES BRIDGE]========================="));
		const dump_amt_oneFXS = new BigNumber("125e18");
		console.log("dump_amt_oneFXS: ", dump_amt_oneFXS.div(BIG18).toNumber());
		
		await oneFXS_instance.transfer(cc_bridge_backer_instance.address, dump_amt_oneFXS, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);


		console.log(chalk.hex("#ff8b3d").bold("=====================DUMP IN SOME USDC [SIMULATES BRIDGE]====================="));
		const dump_amt_USDC = new BigNumber("125e6");
		console.log("dump_amt_USDC: ", dump_amt_USDC.div(BIG6).toNumber());

		await oneUSDC_instance.transfer(cc_bridge_backer_instance.address, dump_amt_USDC, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);


		console.log(chalk.hex("#ff8b3d").bold("===========================SELF-BRIDGE SOME TOKENS OVER [with internal swap]==========================="));
		const self_bridge_swap_amt_E18 = new BigNumber("25e18");
		const self_bridge_swap_amt_E6 = new BigNumber("25e6");
		console.log("self_bridge_swap_amt_E18: ", self_bridge_swap_amt_E18.div(BIG18).toNumber());
		console.log("self_bridge_swap_amt_E6: ", self_bridge_swap_amt_E6.div(BIG6).toNumber());

		console.log("Self-Bridge back canFRAX (internal swap to oneFRAX included)");
		await cc_bridge_backer_instance.selfBridge(0, self_bridge_swap_amt_E18, true, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Self-Bridge back canFXS (internal swap to oneFXS included)");
		await cc_bridge_backer_instance.selfBridge(1, self_bridge_swap_amt_E18, true, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Self-Bridge back oneUSDC");
		await cc_bridge_backer_instance.selfBridge(2, self_bridge_swap_amt_E6, true, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);

		console.log(chalk.hex("#ff8b3d").bold("===========================SELF-BRIDGE SOME TOKENS OVER [no internal swap]==========================="));
		const self_bridge_no_swap_amt_E18 = new BigNumber("25e18");
		const self_bridge_no_swap_amt_E6 = new BigNumber("25e6");
		console.log("self_bridge_no_swap_amt_E18: ", self_bridge_no_swap_amt_E18.div(BIG18).toNumber());
		console.log("self_bridge_no_swap_amt_E6: ", self_bridge_no_swap_amt_E6.div(BIG6).toNumber());

		console.log("Self-Bridge back canFRAX (no internal swap to oneFRAX)");
		await cc_bridge_backer_instance.selfBridge(0, self_bridge_no_swap_amt_E18, false, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Self-Bridge back canFXS (no internal swap to oneFXS)");
		await cc_bridge_backer_instance.selfBridge(1, self_bridge_no_swap_amt_E18, false, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Self-Bridge back oneUSDC");
		await cc_bridge_backer_instance.selfBridge(2, self_bridge_no_swap_amt_E6, false, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);

		console.log(chalk.hex("#ff8b3d").bold("===========================GIVE THE canFRAX CONTRACT SOME oneFRAX ==========================="));
		const giveoneFRAX_amt = new BigNumber("10e18");
		console.log("giveoneFRAX_amt: ", giveoneFRAX_amt.div(BIG18).toNumber());

		await cc_bridge_backer_instance.giveAnyToCan(0, giveoneFRAX_amt, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);


		console.log(chalk.hex("#ff8b3d").bold("===========================SWAP oneFRAX for canFRAX manually==========================="));
		const swapAnyForCanonical_amt_oneFRAX = new BigNumber("50e18");
		console.log("swapAnyForCanonical_amt_oneFRAX: ", swapAnyForCanonical_amt_oneFRAX.div(BIG18).toNumber());

		await cc_bridge_backer_instance.swapAnyForCanonical(0, swapAnyForCanonical_amt_oneFRAX, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);


		console.log(chalk.hex("#ff8b3d").bold("===========================SWAP oneFXS for canFXS manually==========================="));
		const swapAnyForCanonical_amt_oneFXS = new BigNumber("50e18");
		console.log("swapAnyForCanonical_amt_oneFXS: ", swapAnyForCanonical_amt_oneFXS.div(BIG18).toNumber());

		await cc_bridge_backer_instance.swapAnyForCanonical(1, swapAnyForCanonical_amt_oneFXS, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);


		console.log(chalk.hex("#ff8b3d").bold("===========================MINT SOME canFRAX and oneFRAX==========================="));
		const canToken_mint_amt = new BigNumber("125e17");
		console.log("canToken_mint_amt: ", canToken_mint_amt.div(BIG18).toNumber());

		await cc_bridge_backer_instance.mintCanonicalFrax(canToken_mint_amt, { from: COLLATERAL_FRAX_AND_FXS_OWNER });
		await cc_bridge_backer_instance.mintCanonicalFxs(canToken_mint_amt, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);


		console.log(chalk.hex("#ff8b3d").bold("===========================BURN SOME canFRAX and oneFRAX==========================="));
		const canToken_burn_amt = new BigNumber("10e18");
		console.log("canToken_burn_amt: ", canToken_burn_amt.div(BIG18).toNumber());

		await cc_bridge_backer_instance.burnCanonicalFrax(canToken_burn_amt, { from: COLLATERAL_FRAX_AND_FXS_OWNER });
		await cc_bridge_backer_instance.burnCanonicalFxs(canToken_burn_amt, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);


		console.log(chalk.hex("#ff8b3d").bold("===========================COLLECT SOME oneFRAX AND oneFXS==========================="));
		const canToken_collect_amt = new BigNumber("1e18");
		console.log("canToken_collect_amt: ", canToken_collect_amt.div(BIG18).toNumber());

		await cc_bridge_backer_instance.collectBridgeTokens(0, oneFRAX_instance.address, canToken_collect_amt, { from: COLLATERAL_FRAX_AND_FXS_OWNER });
		await cc_bridge_backer_instance.collectBridgeTokens(1, oneFXS_instance.address, canToken_collect_amt, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);


		console.log(chalk.hex("#ff8b3d").bold("===========================ADD A WALLET ADDRESS AS AN AMO==========================="));
		await cc_bridge_backer_instance.addAMO(STAKING_REWARDS_DISTRIBUTOR, true, { from: COLLATERAL_FRAX_AND_FXS_OWNER });


		console.log(chalk.hex("#ff8b3d").bold("===========================NOTE SOME SushiSwapLiquidityAMO_HARM INFO==========================="));
		console.log("Print some info [SushiSwapLiquidityAMO_HARM]");
		let the_allocations_sushiswap_amo = await SushiSwapLiquidityAMO_HARM_instance.showAllocations.call();
		let the_token_balances_sushiswap_amo = await SushiSwapLiquidityAMO_HARM_instance.showTokenBalances.call();
		utilities.printAllocations('SushiSwapLiquidityAMO_HARM', the_allocations_sushiswap_amo, null);
		utilities.printTokenBalances('SushiSwapLiquidityAMO_HARM', the_token_balances_sushiswap_amo, null);


		console.log(chalk.hex("#ff8b3d").bold("===========================GIVE SOME TOKENS TO AMOS [EOA]==========================="));
		let amo_canFRAX_bal_before = new BigNumber(await canFRAX_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG18).toNumber();
		let amo_canFXS_bal_before = new BigNumber(await canFXS_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG18).toNumber();
		let amo_usdc_bal_before = new BigNumber(await oneUSDC_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG6).toNumber();

		console.log("Lend 100 canFRAX");
		await cc_bridge_backer_instance.lendFraxToAMO(STAKING_REWARDS_DISTRIBUTOR, new BigNumber("100e18"), { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Lend 100 canFXS");
		await cc_bridge_backer_instance.lendFxsToAMO(STAKING_REWARDS_DISTRIBUTOR, new BigNumber("100e18"), { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Lend 100 oneUSDC");
		await cc_bridge_backer_instance.lendCollatToAMO(STAKING_REWARDS_DISTRIBUTOR, new BigNumber("100e6"), { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		let amo_canFRAX_bal_after = new BigNumber(await canFRAX_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG18).toNumber();
		let amo_canFXS_bal_after = new BigNumber(await canFXS_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG18).toNumber();
		let amo_usdc_bal_after = new BigNumber(await oneUSDC_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG6).toNumber();

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);

		console.log("FRAX balance [STAKING_REWARDS_DISTRIBUTOR] change: ", amo_canFRAX_bal_after - amo_canFRAX_bal_before);
		console.log("FXS balance [STAKING_REWARDS_DISTRIBUTOR] change: ", amo_canFXS_bal_after - amo_canFXS_bal_before);
		console.log("USDC balance [STAKING_REWARDS_DISTRIBUTOR] change: ", amo_usdc_bal_after - amo_usdc_bal_before);


		console.log(chalk.hex("#ff8b3d").bold("===========================GIVE SOME TOKENS TO AMOS [SMART CONTRACT]==========================="));
		
		console.log("Lend 100 canFRAX");
		await cc_bridge_backer_instance.lendFraxToAMO(SushiSwapLiquidityAMO_HARM_instance.address, new BigNumber("100e18"), { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Lend 100 canFXS");
		await cc_bridge_backer_instance.lendFxsToAMO(SushiSwapLiquidityAMO_HARM_instance.address, new BigNumber("100e18"), { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Lend 100 oneUSDC");
		await cc_bridge_backer_instance.lendCollatToAMO(SushiSwapLiquidityAMO_HARM_instance.address, new BigNumber("100e6"), { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);

		console.log("Print some info [SushiSwapLiquidityAMO_HARM]");
		old_allocations_sushiswap_amo = the_allocations_sushiswap_amo;
		old_balances_sushiswap_amo = the_token_balances_sushiswap_amo;
		the_allocations_sushiswap_amo = await SushiSwapLiquidityAMO_HARM_instance.showAllocations.call();
		the_token_balances_sushiswap_amo = await SushiSwapLiquidityAMO_HARM_instance.showTokenBalances.call();
		utilities.printAllocations('SushiSwapLiquidityAMO_HARM', the_allocations_sushiswap_amo, old_allocations_sushiswap_amo);
		utilities.printTokenBalances('SushiSwapLiquidityAMO_HARM', the_token_balances_sushiswap_amo, old_balances_sushiswap_amo);


		console.log(chalk.hex("#ff8b3d").bold("===========================AMO GIVES BACK TOKENS [EOA, NO BRIDGE]==========================="));
		amo_canFRAX_bal_before = new BigNumber(await canFRAX_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG18).toNumber();
		amo_canFXS_bal_before = new BigNumber(await canFXS_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG18).toNumber();
		amo_usdc_bal_before = new BigNumber(await oneUSDC_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG6).toNumber();

		console.log("Give 25 canFRAX");
		await canFRAX_instance.approve(cc_bridge_backer_instance.address, new BigNumber("25e18"), { from: STAKING_REWARDS_DISTRIBUTOR });
		await cc_bridge_backer_instance.receiveBackViaAMO(canFRAX_instance.address, new BigNumber("25e18"), false, { from: STAKING_REWARDS_DISTRIBUTOR });

		console.log("Give 25 canFXS");
		await canFXS_instance.approve(cc_bridge_backer_instance.address, new BigNumber("25e18"), { from: STAKING_REWARDS_DISTRIBUTOR });
		await cc_bridge_backer_instance.receiveBackViaAMO(canFXS_instance.address, new BigNumber("25e18"), false, { from: STAKING_REWARDS_DISTRIBUTOR });

		console.log("Give 25 oneUSDC");
		await oneUSDC_instance.approve(cc_bridge_backer_instance.address, new BigNumber("25e6"), { from: STAKING_REWARDS_DISTRIBUTOR });
		await cc_bridge_backer_instance.receiveBackViaAMO(oneUSDC_instance.address, new BigNumber("25e6"), false, { from: STAKING_REWARDS_DISTRIBUTOR });

		amo_canFRAX_bal_after = new BigNumber(await canFRAX_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG18).toNumber();
		amo_canFXS_bal_after = new BigNumber(await canFXS_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG18).toNumber();
		amo_usdc_bal_after = new BigNumber(await oneUSDC_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG6).toNumber();

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);

		console.log("canFRAX balance [STAKING_REWARDS_DISTRIBUTOR] change: ", amo_canFRAX_bal_after - amo_canFRAX_bal_before);
		console.log("canFXS balance [STAKING_REWARDS_DISTRIBUTOR] change: ", amo_canFXS_bal_after - amo_canFXS_bal_before);
		console.log("oneUSDC balance [STAKING_REWARDS_DISTRIBUTOR] change: ", amo_usdc_bal_after - amo_usdc_bal_before);


		console.log(chalk.hex("#ff8b3d").bold("===========================AMO GIVES BACK TOKENS [SMART CONTRACT, NO BRIDGE]==========================="));

		console.log("Give back 25 canFRAX");
		await SushiSwapLiquidityAMO_HARM_instance.giveFRAXBack(new BigNumber("25e18"), false, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Give back 25 canFXS");
		await SushiSwapLiquidityAMO_HARM_instance.giveFXSBack(new BigNumber("25e18"), false, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Give back 25 oneUSDC");
		await SushiSwapLiquidityAMO_HARM_instance.giveCollatBack(new BigNumber("25e6"), false, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info [CROSS_CHAIN_BRIDGE_BACKER]");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);

		console.log("Print some info [SushiSwapLiquidityAMO_HARM]");
		old_allocations_sushiswap_amo = the_allocations_sushiswap_amo;
		old_balances_sushiswap_amo = the_token_balances_sushiswap_amo;
		the_allocations_sushiswap_amo = await SushiSwapLiquidityAMO_HARM_instance.showAllocations.call();
		the_token_balances_sushiswap_amo = await SushiSwapLiquidityAMO_HARM_instance.showTokenBalances.call();
		utilities.printAllocations('SushiSwapLiquidityAMO_HARM', the_allocations_sushiswap_amo, old_allocations_sushiswap_amo);
		utilities.printTokenBalances('SushiSwapLiquidityAMO_HARM', the_token_balances_sushiswap_amo, old_balances_sushiswap_amo);


		console.log(chalk.hex("#ff8b3d").bold("===========================AMO GIVES BACK TOKENS [EOA, WITH BRIDGE]==========================="));
		amo_canFRAX_bal_before = new BigNumber(await canFRAX_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG18).toNumber();
		amo_canFXS_bal_before = new BigNumber(await canFXS_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG18).toNumber();
		amo_usdc_bal_before = new BigNumber(await oneUSDC_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG6).toNumber();

		console.log("Give 1 canFRAX");
		await canFRAX_instance.approve(cc_bridge_backer_instance.address, new BigNumber("1e18"), { from: STAKING_REWARDS_DISTRIBUTOR });
		await cc_bridge_backer_instance.receiveBackViaAMO(canFRAX_instance.address, new BigNumber("1e18"), true, { from: STAKING_REWARDS_DISTRIBUTOR });

		console.log("Give 1 canFXS");
		await canFXS_instance.approve(cc_bridge_backer_instance.address, new BigNumber("1e18"), { from: STAKING_REWARDS_DISTRIBUTOR });
		await cc_bridge_backer_instance.receiveBackViaAMO(canFXS_instance.address, new BigNumber("1e18"), true, { from: STAKING_REWARDS_DISTRIBUTOR });

		console.log("Give 1 oneUSDC");
		await oneUSDC_instance.approve(cc_bridge_backer_instance.address, new BigNumber("1e6"), { from: STAKING_REWARDS_DISTRIBUTOR });
		await cc_bridge_backer_instance.receiveBackViaAMO(oneUSDC_instance.address, new BigNumber("1e6"), true, { from: STAKING_REWARDS_DISTRIBUTOR });

		amo_canFRAX_bal_after = new BigNumber(await canFRAX_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG18).toNumber();
		amo_canFXS_bal_after = new BigNumber(await canFXS_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG18).toNumber();
		amo_usdc_bal_after = new BigNumber(await oneUSDC_instance.balanceOf.call(STAKING_REWARDS_DISTRIBUTOR)).div(BIG6).toNumber();

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);

		console.log("canFRAX balance [STAKING_REWARDS_DISTRIBUTOR] change: ", amo_canFRAX_bal_after - amo_canFRAX_bal_before);
		console.log("canFXS balance [STAKING_REWARDS_DISTRIBUTOR] change: ", amo_canFXS_bal_after - amo_canFXS_bal_before);
		console.log("oneUSDC balance [STAKING_REWARDS_DISTRIBUTOR] change: ", amo_usdc_bal_after - amo_usdc_bal_before);


		console.log(chalk.hex("#ff8b3d").bold("===========================AMO GIVES BACK TOKENS [SMART CONTRACT, WITH BRIDGE]==========================="));

		console.log("Give 1 canFRAX");
		await SushiSwapLiquidityAMO_HARM_instance.giveFRAXBack(new BigNumber("1e18"), true, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Give 1 canFXS");
		await SushiSwapLiquidityAMO_HARM_instance.giveFXSBack(new BigNumber("1e18"), true, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Give 1 oneUSDC");
		await SushiSwapLiquidityAMO_HARM_instance.giveCollatBack(new BigNumber("1e6"), true, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info [CROSS_CHAIN_BRIDGE_BACKER]");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);

		console.log("Print some info [SushiSwapLiquidityAMO_HARM]");
		old_allocations_sushiswap_amo = the_allocations_sushiswap_amo;
		old_balances_sushiswap_amo = the_token_balances_sushiswap_amo;
		the_allocations_sushiswap_amo = await SushiSwapLiquidityAMO_HARM_instance.showAllocations.call();
		the_token_balances_sushiswap_amo = await SushiSwapLiquidityAMO_HARM_instance.showTokenBalances.call();
		utilities.printAllocations('SushiSwapLiquidityAMO_HARM', the_allocations_sushiswap_amo, old_allocations_sushiswap_amo);
		utilities.printTokenBalances('SushiSwapLiquidityAMO_HARM', the_token_balances_sushiswap_amo, old_balances_sushiswap_amo);


		console.log(chalk.hex("#ff8b3d").bold("===================== CHECK allBalances() ====================="));
		const all_balances = await cc_bridge_backer_instance.allBalances.call();

		console.log("frax_ttl: ", new BigNumber(all_balances[0]).div(BIG18).toNumber());
		console.log("fxs_ttl: ", new BigNumber(all_balances[1]).div(BIG18).toNumber());
		console.log("col_ttl: ", new BigNumber(all_balances[2]).div(BIG6).toNumber());
		console.log("ttl_val_usd_e18: ", new BigNumber(all_balances[3]).div(BIG18).toNumber());


		console.log(chalk.hex("#ff8b3d").bold("===================== CHECK PROXY EXECUTE ====================="));
		// Proxy execute a token transfer
		let calldata = hre.web3.eth.abi.encodeFunctionCall({
			name: 'transfer',
			type: 'function',
			inputs: [{ type: 'address', name: 'recipient' },{ type: 'uint256', name: 'amount'}]
		}, [INVESTOR_CUSTODIAN_ADDRESS, new BigNumber("1e18")]);

		await cc_bridge_backer_instance.execute(oneFRAX_instance.address, 0, calldata, { from: COLLATERAL_FRAX_AND_FXS_OWNER });

		console.log("Print some info");
		old_allocations = the_allocations;
		old_balances = the_token_balances;
		the_allocations = await cc_bridge_backer_instance.showAllocations.call();
		the_token_balances = await cc_bridge_backer_instance.showTokenBalances.call();
		utilities.printAllocations('CROSS_CHAIN_BRIDGE_BACKER', the_allocations, old_allocations);
		utilities.printTokenBalances('CROSS_CHAIN_BRIDGE_BACKER', the_token_balances, old_balances);

	});

});