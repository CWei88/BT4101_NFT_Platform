require('dotenv').config()
const {ethers} = require('hardhat')

async function transfer() {
    console.log("Getting first token")
    const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
    const token = await ethers.getContractAt('RentableNFT', contractAddress)
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    console.log("Transferring NFT")
    const recp = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
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