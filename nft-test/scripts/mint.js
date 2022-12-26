const { ethers, deployments } = require("hardhat");

async function mint() {
    const accounts = ethers.getSigners();
    const [deployer, owner, buyer1] = accounts;

    const ID = {
        [deployer.address]: "DEPLOYER",
        [owner.address]: "OWNER",
        [buyer1.address]: "BUYER1"
    }

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