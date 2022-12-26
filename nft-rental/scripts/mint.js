const { ethers, deployments } = require("hardhat");

async function mint() {
    const basicNFTContract = await ethers.getContractFactory("BasicNFT")
    const bNC = await basicNFTContract.deploy();

    await bNC.deployed();
    console.log("Contract deployed to: ", bNC.address)
}

mint().then(() => process.exit(0))
.catch((err) => {
    console.error(err)
    process.exit(1)
})