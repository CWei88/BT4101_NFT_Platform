require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0x51eEB2E8836030dC5d34B7e6c37c3Ab44D202d39'

const wrapper = require('../../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json')
const wrapperAddress = "0x3dE1410ceE2053B2958731a548FF51B71ec4F131"

const wrappedToken = require('../../artifacts/contracts/ERC4907/ERC4907.sol/ERC4907.json')

async function list() {
    const Market = await ethers.getContractAt("MarketplaceDC", contractAddress)
    const wToken = await ethers.getContractAt(wrappedToken.abi, wrapperAddress)
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    console.log("Info Received")

    let tokenId = '26'
    const ownerSigner = await ethers.getSigner(owner)
    await wToken.connect(ownerSigner).approve(contractAddress, tokenId)

    console.log("Listing NFT")
    let mktFee = await Market.getListingFee();
    mktFee = mktFee.toString()
    console.log("MktFee received")

    let listTx = await Market.connect(ownerSigner).listNFT(wrapperAddress, tokenId, 10, 1, 3, Math.round(new Date().getTime() / 1000) + (2*24*60*60), true, {value: mktFee})
    await listTx.wait()

    console.log("NFT Listed")

    console.log("Listing second NFT")
    let tokenId2 = '27'
    await wToken.connect(ownerSigner).approve(contractAddress, tokenId2)
    let listTx2 = await Market.connect(ownerSigner).listNFT(wrapperAddress, tokenId2, 100, 1, 3, Math.round(new Date().getTime() / 1000) + (2*24*60*60), false, {value: mktFee})
    await listTx2.wait()
    console.log('Second NFT Listed')
}

list().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})

