require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../artifacts/contracts/NFTRM.sol/NFTRM.json')
const contractAddress = '0x3a00adB1e6BB3EF718227Ae62e6371790C7ab95A'

const rentableContract = require('../artifacts/contracts/RentableNFT.sol/RentableNFT.json')

async function list() {
    const Market = await ethers.getContractAt("NFTRM", contractAddress)

    console.log("Getting first token to list")
    const NFTAddress = '0x0E99b6eEAF4777b8D3b9A6dEd29a363df43adED3'
    const token = await ethers.getContractAt('RentableNFT', NFTAddress)
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    console.log("Info Received")

    //let provider = ethers.getDefaultProvider('goerli')
    //const txRecp = await provider.getTransactionReceipt('0x217595f7d263426370b62e69cbd860d54406411f9711d453b257e1cfb965fa37')
    //let tokenHex = txRecp.logs[0].topics[3]
    let tokenId = '2'
    console.log(tokenId)

    const ownerSigner = await ethers.getSigner(owner)

    await token.connect(ownerSigner).approve(contractAddress, tokenId)

    console.log("Listing NFT")
    let mktFee = await Market.getListingFee();
    mktFee = mktFee.toString()
    console.log("MktFee received")

    let listTx = await Market.connect(ownerSigner).listNFT(NFTAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 900, 
    Math.round(new Date().getTime() / 1000) + 900, {value: mktFee})
    await listTx.wait()

    console.log("NFT Listed")
   
}

async function rent() {
    const Market = await ethers.getContractAt("NFTRM", contractAddress)

    const renter = '0xD172885233efaa6Ce7018c0718D12550a2991196'
    const NFTAddress = '0x0E99b6eEAF4777b8D3b9A6dEd29a363df43adED3'

    const renterSigner = await ethers.getSigner(renter)

    console.log("Renting NFT")
    let rentTx = await Market.connect(renterSigner).rentNFT('2', {value: 1})
    await rentTx.wait()

    console.log("NFT Rented")
}

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

/*list().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})*/

/*rent().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})*/

delist().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})


