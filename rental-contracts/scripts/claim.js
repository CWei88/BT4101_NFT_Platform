require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0xa29d10dAD47784a00Aa14372d63b39466fE30e8A'

const rentableContract = require('../artifacts/contracts/RentableNFT.sol/RentableNFT.json')

async function claim() {
    
}