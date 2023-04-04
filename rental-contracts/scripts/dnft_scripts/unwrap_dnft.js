require('dotenv').config()
const {ethers} = require('hardhat')

const wrapper = require('../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json')
const wrapperAddress = "0xfD3E5809B411AE36f791D05F6BaD61AA018C0214"

async function unwrap() {
    const wrap = await ethers.getContractAt("ERC4907Wrapper", wrapper);
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    let tokenId = '1'
    const ownerSigner = await ethers.getSigner(owner)

    console.log("Unwrapping NFT");
    let unwrapTx = await wrap.connect(ownerSigner).unwrapToken(tokenId)
    await unwrapTx.wait();

    console.log("Token successfully unwrapped")
}

unwrap().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})