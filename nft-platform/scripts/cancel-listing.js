// Cancel Item

const { ethers, deployments } = require('hardhat')

const TOKEN_ID = 2

async function cancelListing() {
    const accounts = await ethers.getSigners()
    const [owner] = accounts

    //const NFTMarketplaceContractFactory = await ethers.getContractFactory("NFTMarketplace")
   // const NMPD = await NFTMarketplaceContractFactory.connect(owner).deploy();
    //const NMPDed = await NMPD.deployed()

    //const basicNFTContractFactory = await ethers.getContractFactory("BasicNFT")
    //const BNCFD = await basicNFTContractFactory.connect(owner).deploy()
    //const BNCF = await BNCFD.deployed()

    const NFTMPde = await deployments.get("NFTMarketplace")
    const BNFde = await deployments.get("BasicNFT")

    const NFTMarketplaceContract = await ethers.getContractAt(NFTMPde.abi, NFTMPde.address)
    const basicNFTContract = await ethers.getContractAt(BNFde.abi, BNFde.address)

    const tx = await NFTMarketplaceContract.connect(owner).cancelListing(basicNFTContract.address, TOKEN_ID)
    const cancelTxRecp = await tx.wait()

    console.log(`NFT with ID ${TOKEN_ID} has been delisted.`)

    //Check if listing has been cancelled
    const canceledListing = await NFTMarketplaceContract.getListing(basicNFTContract.address, TOKEN_ID)
    console.log("There is no address for seller: ", canceledListing.seller)

}

cancelListing().then(() => process.exit(0))
.catch((err) => {
    console.error(err)
    process.exit(1)
})