require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0xa29d10dAD47784a00Aa14372d63b39466fE30e8A'

const wrapperContract = require('../artifacts/contracts/ERC4907/ERC4907.sol/ERC4907.json')

async function rent() {
    const Market = await ethers.getContractAt("MarketplaceDC", contractAddress)

    const renter = '0xD172885233efaa6Ce7018c0718D12550a2991196'
    const NFTAddress = '0xfD3E5809B411AE36f791D05F6BaD61AA018C0214'

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