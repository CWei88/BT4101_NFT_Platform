const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    
    const normalNFT = await ethers.getContractFactory('DiffTypeNFT');
    const nNFT = await normalNFT.deploy();

    await nNFT.deployed()

    const data = {
        address: nNFT.address,
        abi: JSON.parse(nNFT.interface.format('json'))
    }

    //Writes the ABI and address to marketplace.json
    //Used by frontend files to connect with smart contract
    fs.writeFileSync('./nNFT.json', JSON.stringify(data));

    console.log(nNFT.address)
    console.log("NFT deployed!")
}

main().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})