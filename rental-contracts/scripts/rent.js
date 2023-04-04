require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0xa29d10dAD47784a00Aa14372d63b39466fE30e8A'

const rentableContract = require('../artifacts/contracts/RentableNFT.sol/RentableNFT.json')

async function rent() {
    const Market = await ethers.getContractAt("MarketplaceDC", contractAddress)

    const renter = '0xD172885233efaa6Ce7018c0718D12550a2991196'
    const NFTAddress = '0x5eA85Ff0d0C68f6F9A15E8F53196d514ac5B2186'

    const renterSigner = await ethers.getSigner(renter)

    console.log("Renting NFT")
    let rentTx = await Market.connect(renterSigner).rentNFT('1', {value: 100})
    await rentTx.wait()

    console.log("NFT Rented")
}

rent().then(() => process.exit(0))  
.catch((err) => {
    console.log(err)
    process.exit(1)
})