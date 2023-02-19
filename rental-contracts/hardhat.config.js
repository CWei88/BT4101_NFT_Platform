/** @type import('hardhat/config').HardhatUserConfig */
require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()

const {API_URL, PRIVATE_KEY, SECONDARY_PRIVATE_KEY} = process.env;

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
	defaultNetwork: "hardhat",

	networks: {
		hardhat: {
			chainId: 31337,
		},
		goerli: {
			url: API_URL,
			accounts: [`0x${PRIVATE_KEY}`, `0x${SECONDARY_PRIVATE_KEY}`]
		}
	}
}
