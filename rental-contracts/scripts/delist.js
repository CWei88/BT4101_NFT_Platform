require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0xa29d10dAD47784a00Aa14372d63b39466fE30e8A'

const rentableContract = require('../artifacts/contracts/RentableNFT.sol/RentableNFT.json')

async function delist() {
    const Market = await ethers.getContractAt("NFTRM", contractAddress)

    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'
    const NFTAddress = '0x0E99b6eEAF4777b8D3b9A6dEd29a363df43adED3'
    const ownerSigner = await ethers.getSigner(owner)

    console.log("Delisting NFT")
    let delistTx = await Market.connect(ownerSigner).delistNFT(NFTAddress, '2')
    await delistTx.wait()

    console.log("NFT delisted")
}

delist().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})