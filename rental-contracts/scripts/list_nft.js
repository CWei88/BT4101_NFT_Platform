require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0xa29d10dAD47784a00Aa14372d63b39466fE30e8A'

const rentableContract = require('../artifacts/contracts/RentableNFT.sol/RentableNFT.json')

async function list() {
    const Market = await ethers.getContractAt("MarketplaceDC", contractAddress)

    console.log("Getting first token to list")
    const NFTAddress = '0x5eA85Ff0d0C68f6F9A15E8F53196d514ac5B2186'
    const token = await ethers.getContractAt('RentableNFT', NFTAddress)
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    console.log("Info Received")

    //let provider = ethers.getDefaultProvider('goerli')
    //const txRecp = await provider.getTransactionReceipt('0x217595f7d263426370b62e69cbd860d54406411f9711d453b257e1cfb965fa37')
    //let tokenHex = txRecp.logs[0].topics[3]
    let tokenId = '1'
    console.log(tokenId)

    const ownerSigner = await ethers.getSigner(owner)

    await token.connect(ownerSigner).approve(contractAddress, tokenId)

    console.log("Listing NFT")
    let mktFee = await Market.getListingFee();
    mktFee = mktFee.toString()
    console.log("MktFee received")

    let listTx = await Market.connect(ownerSigner).listNFT(NFTAddress, tokenId, 100, 1, 3, Math.round(new Date().getTime() / 1000) + (3*24*60*60), false, {value: mktFee})
    await listTx.wait()

    console.log("NFT Listed")

    let secondTokenId = '2';
    await token.connect(ownerSigner).approve(contractAddress, secondTokenId)

    console.log('Listing second NFT')
    let listTx2 = await Market.connect(ownerSigner).listNFT(NFTAddress, secondTokenId, 10, 1, 3, Math.round(new Date().getTime() / 1000) + (2*24*60*60), true, {value: mktFee})
    console.log("Second NFT Listed")
   
}

list().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})
