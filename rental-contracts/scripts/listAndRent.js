require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../artifacts/contracts/NFTRM.sol/NFTRM.json')
const contractAddress = '0xacFD42d69790aabdE806ae992097aFF284d1E64F'

async function list() {
    const Market = await ethers.getContractAt("NFTRM", contractAddress)

    console.log("Getting first token to list")
    const NFTAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
    const token = await ethers.getContractAt('RentableNFT', NFTAddress)
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    //let provider = ethers.getDefaultProvider('goerli')
    //const txRecp = await provider.getTransactionReceipt('0x217595f7d263426370b62e69cbd860d54406411f9711d453b257e1cfb965fa37')
    //let tokenHex = txRecp.logs[0].topics[3]
    let tokenId = '1'
    console.log(tokenId)

    const ownerSigner = await ethers.getSigner(owner)

    console.log("Listing NFT")
    let mktFee = await Market.getListingFee();
    mktFee = mktFee.toString()
    console.log("MktFee received")

    let listTx = await Market.connect(ownerSigner).listNFT(NFTAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 900, Math.round(new Date().getTime() / 1000) + 900, {value: mktFee})
    await listTx.wait()

    console.log("NFT Listed")
   
}

list().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})
