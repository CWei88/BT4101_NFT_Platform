const { ethers } = require("hardhat");

async function main() {
    const Token = await ethers.getContractFactory("Token");

    const Test = await Token.deploy();
    await Test.deployed()
    console.log("Contract deployed to address:", Test.address)

}

main().then(() => process.exit(0))
.catch((error) => {
    console.error(error)
    process.exit(1)
})