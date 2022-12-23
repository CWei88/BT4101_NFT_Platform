// Checks seller proceeds

const {ethers, deployments} = require('hardhat')

async function getProceeds() {
    const accounts = await ethers.getSigners()
    const [deployer, owner] = accounts

    const res = await deployments.get("NFTMarketplace")

   // const NFTMarketplaceContractFactory = await ethers.getContractFactory("NFTMarketplace")
    //const NMPD = await NFTMarketplaceContractFactory.connect(owner).deploy();
    //const NMPDed = await NMPD.deployed()

    const NFTMarketplaceContract = await ethers.getContractAt(res.abi, res.address)

    const proceeds = await NFTMarketplaceContract.getProfits(owner.address)

    const proceedsWei = ethers.utils.formatEther(proceeds.toString())
    console.log(`Seller ${owner.address} has ${proceedsWei} eth`)
}

getProceeds().then(() => process.exit(0))
.catch((err) => {
    console.error(err)
    process.exit(1)
})

