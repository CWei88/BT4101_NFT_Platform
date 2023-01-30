const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    
    const rentableNFT = await ethers.getContractFactory("RentableNFT");
    const rNFT = await rentableNFT.deploy("Rentable", "RNFT");

    await rNFT.deployed()

    const data = {
        address: rNFT.address,
        abi: JSON.parse(rNFT.interface.format('json'))
    }

    //Writes the ABI and address to marketplace.json
    //Used by frontend files to connect with smart contract
    fs.writeFileSync('./rNFT.json', JSON.stringify(data));

    console.log(rNFT.address)
    console.log("NFT deployed!")
}

main().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})