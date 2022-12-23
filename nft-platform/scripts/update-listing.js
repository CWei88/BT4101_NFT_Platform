// UPDATE LISTING

const {ethers, deployments} = require('hardhat')

const TOKEN_ID = 1

async function updateListing() {
    const accounts = await ethers.getSigners()
    const [deployer, owner, buyer1] = accounts

    const ID = {
        [deployer.address]: "DEPLOYER",
        [owner.addres]: "OWNER",
        [buyer1.address]: "BUYER1"
    }

    //const NFTMarketplaceContractFactory = await ethers.getContractFactory("NFTMarketplace")
    //const NMPD = await NFTMarketplaceContractFactory.connect(owner).deploy();
    //const NMPDed = await NMPD.deployed()

    //const basicNFTContractFactory = await ethers.getContractFactory("BasicNFT")
    //const BNCFD = await basicNFTContractFactory.connect(owner).deploy()
    //const BNCF = await BNCFD.deployed()

    const NFTMPde = await deployments.get("NFTMarketplace")
    const BNFde = await deployments.get("BasicNFT")

    const NFTMarketplaceContract = await ethers.getContractAt(NFTMPde.abi, NFTMPde.address)
    const basicNFTContract = await ethers.getContractAt(BNFde.abi, BNFde.address)

    console.log(`Updating listing for token ID ${TOKEN_ID} with a new price`)
    const updateTx = await NFTMarketplaceContract.connect(owner).updateListing(basicNFTContract.address, TOKEN_ID, ethers.utils.parseEther("0.5"))

    const updateTxRecp = await updateTx.wait()
    const updatedPrice = updateTxRecp.events[0].args.price
    console.log("Updated price is: ", updatedPrice.toString())

    //Check if listing has been updated
    const updatedListing = await NFTMarketplaceContract.getListing(basicNFTContract.address, TOKEN_ID)
    console.log(`Updated Listing has price of ${updatedListing.price.toString()}`)
}

updateListing().then(() => process.exit(0))
.catch((err) => {
    console.error(err)
    process.exit(1)
})