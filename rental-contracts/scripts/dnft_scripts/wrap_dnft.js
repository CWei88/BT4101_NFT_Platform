require('dotenv').config()
const {ethers} = require('hardhat')

const wrapper = require('../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json')
const wrapperAddress = "0xfD3E5809B411AE36f791D05F6BaD61AA018C0214"

async function wrap() {
    const NFTAddress = '0xAFBa120f281FF1dc7850Fd6b2AAaB3d20Bfad713'
    const wrap = await ethers.getContractAt("ERC4907Wrapper", wrapper);
    const token = await ethers.getContractAt("DiffTypeNFT", NFTAddress);
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    console.log('Info Received');
    let tokenId = '1';
    const ownerSigner = await ethers.getSigner(owner)
    await token.connect(ownerSigner).approve(wrapperAddress, tokenId)

    console.log("Wrapping NFT");
    let wrapTx = wrap.connect(ownerSigner).wrapToken(NFTAddress, tokenId);
    let wrapRes = await wrapTx.wait();
    console.log("Token Wrapped");
    console.log("Token ID is", wrapRes.events[2].args.tokenId)

    console.log("Wrapping second NFT")
    let tokenId2 = '2'
    await token.connect(ownerSigner).approve(wrapperAddress, tokenId2);

    console.log("Wrapping NFT");
    let wrapTx2 = wrap.connect(ownerSigner).wrapToken(NFTAddress, tokenId2);
    let wrapRes2 = await wrapTx.wait();
    console.log("Token Wrapped");
    console.log("Token ID is", wrapRes.events[2].args.tokenId)
}

wrap().then()
.catch((err) => {
    console.log(err)
    process.exit(1)
})