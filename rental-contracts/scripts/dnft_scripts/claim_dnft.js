require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0x51eEB2E8836030dC5d34B7e6c37c3Ab44D202d39'

const wrapperContract = require('../../artifacts/contracts/ERC4907/ERC4907.sol/ERC4907.json')

async function claim() {
    const market = await ethers.getContractAt("MarketplaceDC", contractAddress);

    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'
    const NFTAddress = '0x3dE1410ceE2053B2958731a548FF51B71ec4F131'
    const ownerSigner = await ethers.getSigner(owner)

    console.log("Claiming NFT");
    let claimTx = await market.connect(ownerSigner).claimNFT(NFTAddress, '22')
    await claimTx.wait();

    console.log("NFT claimed")
}

claim().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})