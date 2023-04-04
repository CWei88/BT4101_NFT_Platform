require('dotenv').config()
const {ethers} = require('hardhat')

async function rent() {
    console.log("Getting token for rent")
    const contractAddress = "0x1476377940d5C8fC1524F6f5C7580585fDFcfF52"
    const wrapperContract= require('../artifacts/contracts/ERC4907/ERC4907.sol/ERC4907.json')
    const wToken = await ethers.getContractAt(wrapperContract.abi, contractAddress)
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    const renter = '0xD172885233efaa6Ce7018c0718D12550a2991196'
    const tokenId = '1'
    const expiry = Math.round(new Date().getTime() / 1000) + 600
    let tx = await wToken.setUser(tokenId, renter, expiry)
    await tx.wait();

    console.log(`NFT ${tokenId} rented to ${renter} until ${expiry}`)
    console.log(tx.hash)
}

rent().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})