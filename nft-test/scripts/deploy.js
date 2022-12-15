const { ethers } = require('hardhat')

async function main() {
    const VoteManager = await ethers.getContractFactory('VoteManager')
    const vMCD = await VoteManager.deploy();

    await vMCD.deployed();
    console.log("Vote Manager deployed to: ", vMCD.address);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
})