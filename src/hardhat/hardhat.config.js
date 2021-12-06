const path = require('path');
const envPath = path.join(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

require('hardhat-deploy');
require('hardhat-contract-sizer');
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');
require("@nomiclabs/hardhat-vyper");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
		hardhat: {
			forking: {
				// url: `${process.env.ARBITRUM_NETWORK_ENDPOINT}`, // Arbitrum
				// url: `${process.env.AURORA_NETWORK_ENDPOINT}`, // Aurora
				// url: `${process.env.AVALANCHE_FORKING_NETWORK_ENDPOINT}`, // Avalanche
				// url: `${process.env.BOBA_NETWORK_ENDPOINT}`, // Boba
				// url: `${process.env.BSC_NETWORK_ENDPOINT}`, // BSC
				url: `${process.env.ETHEREUM_NETWORK_ENDPOINT}`, // Ethereum
				// url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}` // Ethereum (alternate)
				// url: `${process.env.FANTOM_FORKING_NETWORK_ENDPOINT}`, // Fantom
				// url: `${process.env.HARMONY_NETWORK_ENDPOINT}`, // Harmony
				// url: `${process.env.MOONRIVER_NETWORK_ENDPOINT}`, // Moonriver
				// url: `${process.env.POLYGON_NETWORK_ENDPOINT}`, // Polygon
				
			},
			accounts: {
				mnemonic: process.env.ROPSTEN_HARDHAT_PHRASE
			},
		},
		arbitrum: {
			url: process.env.ARBITRUM_NETWORK_ENDPOINT,
			accounts: {
				mnemonic: process.env.ARBITRUM_MNEMONIC_PHRASE
			},
			chainId: 42161,
			gas: "auto",
			gasPrice: 3500000000, // 3.5 Gwei
			gasMultiplier: 1.2
		},
		aurora: {
			url: process.env.AURORA_NETWORK_ENDPOINT,
			accounts: {
				mnemonic: process.env.AURORA_MNEMONIC_PHRASE
			},
			chainId: 1313161554,
			gas: "auto",
			gasPrice: 3500000000, // 3.5 Gwei
			gasMultiplier: 1.2
		},
		avalanche: {
			url: process.env.AVALANCHE_NETWORK_ENDPOINT,
			accounts: {
				mnemonic: process.env.AVALANCHE_MNEMONIC_PHRASE
			},
			chainId: 43114,
			gas: "auto",
			gasPrice: 225000000000, // 225 Gwei
			gasMultiplier: 1.2
		},
		boba: {
			url: process.env.BOBA_NETWORK_ENDPOINT,
			accounts: {
				mnemonic: process.env.BOBA_MNEMONIC_PHRASE
			},
			chainId: 288,
			gas: "auto",
			gasPrice: 12500000000, // 12.5 Gwei
			gasMultiplier: 1.2
		},
		bsc: {
			url: process.env.BSC_NETWORK_ENDPOINT,
			accounts: {
				mnemonic: process.env.BSC_MNEMONIC_PHRASE
			},
			chainId: 56,
			gas: "auto",
			gasPrice: 10000000000, // 10 Gwei
			gasMultiplier: 1.2
		},
		ethereum: {
			url:`${process.env.ETHEREUM_NETWORK_ENDPOINT}`,
			accounts: {
				mnemonic: process.env.MNEMONIC_PHRASE
			},
			chainId: 1,
			gas: "auto",
			gasPrice: 170000000000,
			gasMultiplier: 1.2
		},
		fantom: {
			url: process.env.FANTOM_NETWORK_ENDPOINT,
			accounts: {
				mnemonic: process.env.FANTOM_MNEMONIC_PHRASE
			},
			chainId: 250,
			gas: "auto",
			gasPrice: 300000000000, // 300 Gwei
			gasMultiplier: 1.2
		},
		harmony: {
			url: process.env.HARMONY_NETWORK_ENDPOINT,
			accounts: {
				mnemonic: process.env.HARMONY_MNEMONIC_PHRASE
			},
			chainId: 1666600000,
			gas: "auto",
			gasPrice: 5000000000, // 5 Gwei
			gasMultiplier: 1.2
		},
		moonriver: {
			url: process.env.MOONRIVER_NETWORK_ENDPOINT,
			accounts: {
				mnemonic: process.env.MOONRIVER_MNEMONIC_PHRASE
			},
			chainId: 1285,
			gas: "auto",
			gasPrice: 5000000000, // 5 Gwei
			gasMultiplier: 1.2
		},
		polygon: {
			url: `${process.env.POLYGON_NETWORK_ENDPOINT}`,
			accounts: {
				mnemonic: process.env.POLYGON_MNEMONIC_PHRASE
			},
			chainId: 137,
			gas: "auto",
			gasPrice: 50000000000, // 50 Gwei
			gasMultiplier: 1.2
		},
		ropsten: {
			url:`https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
			accounts: {
				mnemonic: process.env.MNEMONIC_PHRASE
			},
			chainId: 3,
			gas: "auto",     
			gasPrice: "auto", 
			gasMultiplier: 1.2
		},
		rinkeby: {
			url:`https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
			accounts: {
				mnemonic: process.env.MNEMONIC_PHRASE
			},
			chainId: 4,
			gas: "auto",
			gasPrice: "auto",
			gasMultiplier: 1.2
		}
    },
	solidity: {
		compilers: [
			{
				version: "0.5.17",
				settings: {
					optimizer: {
						enabled: true,
						runs: 100000
					}
				  }
			},
			{
				version: "0.6.11",
				settings: {
					optimizer: {
						enabled: true,
						runs: 100000
					}
				  }
			},
			{
				version: "0.7.6",
				settings: {
					optimizer: {
						enabled: true,
						runs: 100000
					}
				  }
			},
			// {
			// 	version: "0.8.0",
			// 	settings: {
			// 		optimizer: {
			// 			enabled: true,
			// 			runs: 100000
			// 		}
			// 	  }
			// },
			// {
			// 	version: "0.8.2",
			// 	settings: {
			// 		optimizer: {
			// 			enabled: true,
			// 			runs: 100000
			// 		}
			// 	  }
			// },
			{
				version: "0.8.4",
				settings: {
					optimizer: {
						enabled: true,
						runs: 100000
					}
				  }
			},
			// {
			// 	version: "0.8.6",
			// 	settings: {
			// 		optimizer: {
			// 			enabled: true,
			// 			runs: 100000
			// 		}
			// 	  }
			// }
			{
				version: "0.8.10",
				settings: {
					optimizer: {
						enabled: true,
						runs: 100000
					}
				  }
			}
		],
	},
    paths: {
      sources: "./contracts",
      tests: "./test",
      cache: "./cache",
      artifacts: "./artifacts"
    },
    mocha: {
      timeout: 500000
	},
	etherscan: {
		// apiKey: process.env.BSCSCAN_API_KEY // BSC
		apiKey: process.env.ETHERSCAN_API_KEY, // ETH Mainnet
		// apiKey: process.env.FTMSCAN_API_KEY // Fantom
		// apiKey: process.env.POLYGONSCAN_API_KEY // Polygon
	},

	contractSizer: {
		alphaSort: true,
		runOnCompile: true,
		disambiguatePaths: false,
	},
    vyper: {
		version: "0.2.15"
    }
};

