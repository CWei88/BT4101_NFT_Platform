/** @type import('hardhat/config').HardhatUserConfig */
require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox')
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-contract-sizer");

const { API_URL, PRIVATE_KEY } = process.env;
module.exports = {
	solidity: "0.8.17",
	defaultNetwork: 'hardhat',
	networks: {
		hardhat: {
			chainId:31337
		},

		localhost: {
			chainId: 31337,
		}
	},

	namedAccounts: {
		deployer: {
			default: 0,
			1: 0
		}
	},

	mocha: {
		timeout: 200000
	}
};
