/** @type import('hardhat/config').HardhatUserConfig */
require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()

const {API_URL, PRIVATE_KEY} = process.env;

module.exports = {
	solidity: {
		version: '0.8.17',
		settings: {
			optimizer: {
				enabled: true,
				runs:200
			}
		}
	},

	networks: {
		hardhat: {
			chainId: 1337
		},
		goerli: {
			url: API_URL,
			accounts: [`0x${PRIVATE_KEY}`]
		}
	}
}
