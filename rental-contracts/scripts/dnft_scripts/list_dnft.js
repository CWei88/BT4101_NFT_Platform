require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0xa29d10dAD47784a00Aa14372d63b39466fE30e8A'

const wrapper = require('../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json')
const wrapperAddress = "0xfD3E5809B411AE36f791D05F6BaD61AA018C0214"

const wrappedToken = require('../artifacts/contracts/ERC4907/ERC4907.sol/ERC4907.json')

async function list() {
    const Market = await ethers.getContractAt("MarketplaceDC", contractAddress)
    const wToken = await ethers.getContractAt(wrappedToken.abi, wrapperAddress)
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    console.log("Info Received")

    let tokenId = '1'
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
    let tokenId2 = '2'
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

