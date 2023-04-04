require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0xa29d10dAD47784a00Aa14372d63b39466fE30e8A'

const wrapperContract = require('../../artifacts/contracts/ERC4907/ERC4907.sol/ERC4907.json')

async function delist() {
    const Market = await ethers.getContractAt("MarketplaceDC", contractAddress)

    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'
    const NFTAddress = '0xfD3E5809B411AE36f791D05F6BaD61AA018C0214'
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