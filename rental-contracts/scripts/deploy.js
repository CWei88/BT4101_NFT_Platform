const { ethers } = require("hardhat");
const fs = require("fs");

const PUBLIC_KEY = process.env.REACT_APP_PUBLIC_KEY

async function main() {

    const Mplace = await ethers.getContractFactory('MarketplaceDC')
    const marketplace = await Mplace.deploy(PUBLIC_KEY, PUBLIC_KEY, 10, 10);
    const wrap = await ethers.getContractFactory('ERC4907Wrapper');
    const wrapper = await wrap.deploy(PUBLIC_KEY, "MarketNFT", "MNFT");

    await marketplace.deployed();
    await wrapper.deployed();


    //Pull the address and ABI out while you deploy, since that will be key in interacting with the smart contract
    const data = {
        address: marketplace.address,
        abi: JSON.parse(marketplace.interface.format('json'))
    }

    const wrapperData = {
        address: wrapper.address,
        abi: JSON.parse(wrapper.interface.format('json'))
    }

    //Writes the ABI and address to marketplace.json
    //Used by frontend files to connect with smart contract
    fs.writeFileSync('./src/MplaceDC.json', JSON.stringify(data));
    fs.writeFileSync('./src/Wrapper.json', JSON.stringify(wrapperData))

    console.log("Marketplace deployed!")
    console.log(marketplace.address)
}

main().then(() => process.exit(0))
.catch((err) => {
    console.error(err)
    process.exit(1)
})