const { ethers, deployments } = require("hardhat");

const TOKEN_ID = 0 //SET BEFORE RUNNING SCRIPT  

async function BuyItem() {
    const accounts = await ethers.getSigners();
    const [deployer, owner, buyer1] = accounts;

    const ID = {
        [deployer.address]: "DEPLOYER",
        [owner.address]: "OWNER",
        [buyer1.address]: "BUYER_1"
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

    const listing = await NFTMarketplaceContract.getListing(basicNFTContract.address, TOKEN_ID)

    const price = listing.price.toString()
    const tx = await NFTMarketplaceContract.connect(buyer1).buyItem(basicNFTContract.address, TOKEN_ID, {
        value: price
    })

    await tx.wait()
    console.log("NFT Bought!")

    const newOwner = await basicNFTContract.ownerOf(TOKEN_ID)
    console.log(`New owner of Token ID ${TOKEN_ID} is ${newOwner} with identity of ${ID[newOwner]}`)

}

BuyItem().then(() => process.exit(0))
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })