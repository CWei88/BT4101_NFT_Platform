require('dotenv').config()
const {ethers} = require('hardhat')

async function transfer() {
    console.log("Getting first token")
    const contractAddress = '0x0E99b6eEAF4777b8D3b9A6dEd29a363df43adED3'
    const token = await ethers.getContractAt('RentableNFT', contractAddress)
    const owner = '0xd172885233efaa6ce7018c0718d12550a2991196'

    console.log("Transferring NFT")
    const recp = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'
    const tokenId = '1';
    let tx = await token["safeTransferFrom(address,address,uint256)"](owner, recp, tokenId);
    await tx.wait();

    console.log(`NFT ${tokenId} transferred from ${owner} to ${recp}`)
}

transfer().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})