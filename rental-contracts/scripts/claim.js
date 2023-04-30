require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0xa29d10dAD47784a00Aa14372d63b39466fE30e8A'

const rentableContract = require('../artifacts/contracts/RentableNFT.sol/RentableNFT.json')

async function claim() {
    const market = await ethers.getContractAt("MarketplaceDC", contractAddress);

    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'
    const NFTAddress = '0x5eA85Ff0d0C68f6F9A15E8F53196d514ac5B2186'
    const ownerSigner = await ethers.getSigner(owner)

    console.log("Claiming NFT");
    let claimTx = await market.connect(ownerSigner).claimNFT(NFTAddress, '2')
    await claimTx.wait();

    console.log("NFT claimed")
}

claim().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})