require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0x51eEB2E8836030dC5d34B7e6c37c3Ab44D202d39'

const wrapperContract = require('../../artifacts/contracts/ERC4907/ERC4907.sol/ERC4907.json')

async function rent() {
    const Market = await ethers.getContractAt("MarketplaceDC", contractAddress)

    const renter = '0xD172885233efaa6Ce7018c0718D12550a2991196'
    const NFTAddress = '0x3dE1410ceE2053B2958731a548FF51B71ec4F131'

    const renterSigner = await ethers.getSigner(renter)

    console.log("Renting NFT")
    let rentTx = await Market.connect(renterSigner).rentNFT(NFTAddress, '1', 1, {value: 10})
    await rentTx.wait()

    console.log("NFT Rented")
}

rent().then(() => process.exit(0))  
.catch((err) => {
    console.log(err)
    process.exit(1)
})