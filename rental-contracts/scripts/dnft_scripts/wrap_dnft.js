require('dotenv').config()
const {ethers} = require('hardhat')

const wrapper = require('../../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json')
const wrapperAddress = "0x3dE1410ceE2053B2958731a548FF51B71ec4F131"

async function wrap() {
    const NFTAddress = '0x71c172328A1f7146c98D31A0730FCc7c323D61A8'
    const wrap = await ethers.getContractAt("ERC4907Wrapper", wrapperAddress);
    const token = await ethers.getContractAt("DiffTypeNFT", NFTAddress);
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    console.log('Info Received');
    let tokenId = '1';
    const ownerSigner = await ethers.getSigner(owner)
    await token.connect(ownerSigner).approve(wrapperAddress, tokenId)

    console.log("Wrapping NFT");
    let wrapTx = await wrap.connect(ownerSigner).wrapToken(NFTAddress, tokenId);
    let wrapRes = await wrapTx.wait()
    console.log("Token Wrapped");
    console.log("Token ID is", wrapRes.events[2].args.tokenId)

    console.log("Wrapping second NFT")
    let tokenId2 = '2'
    await token.connect(ownerSigner).approve(wrapperAddress, tokenId2);

    console.log("Wrapping NFT");
    let wrapTx2 = await wrap.connect(ownerSigner).wrapToken(NFTAddress, tokenId2);
    let wrapRes2 = await wrapTx2.wait();
    console.log("Token Wrapped");
    console.log("Token ID is", wrapRes2.events[2].args.tokenId)
}

wrap().then()
.catch((err) => {
    console.log(err)
    process.exit(1)
})