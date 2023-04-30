require('dotenv').config()
const {ethers} = require('hardhat')

const wrapper = require('../../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json')
const wrapperAddress = "0x3dE1410ceE2053B2958731a548FF51B71ec4F131"

async function unwrap() {
    const wrap = await ethers.getContractAt("ERC4907Wrapper", wrapperAddress);
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    let tokenId = '22'
    const ownerSigner = await ethers.getSigner(owner)

    console.log("Unwrapping NFT: " + tokenId);
    let unwrapTx = await wrap.connect(ownerSigner).unwrapToken(tokenId)
    await unwrapTx.wait();

    console.log("Token successfully unwrapped")
}

unwrap().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})