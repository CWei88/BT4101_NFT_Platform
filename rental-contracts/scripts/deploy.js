const { ethers } = require("hardhat");
const fs = require("fs");

const PUBLIC_KEY = process.env.PUBLIC_KEY

async function main() {

    const Mplace = await ethers.getContractFactory('MarketplaceDC')
    const marketplace = await Mplace.deploy(PUBLIC_KEY, PUBLIC_KEY, 1);

    await marketplace.deployed();

    //Pull the address and ABI out while you deploy, since that will be key in interacting with the smart contract
    const data = {
        address: marketplace.address,
        abi: JSON.parse(marketplace.interface.format('json'))
    }

    //Writes the ABI and address to marketplace.json
    //Used by frontend files to connect with smart contract
    fs.writeFileSync('./src/MplaceDC.json', JSON.stringify(data));

    console.log("Marketplace deployed!")
    console.log(marketplace.address)
}

main().then(() => process.exit(0))
.catch((err) => {
    console.error(err)
    process.exit(1)
})