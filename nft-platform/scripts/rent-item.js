const { ethers, deployments } = require("hardhat");

const TOKEN_ID = 0 //SET BEFORE RUNNING SCRIPT  

async function RentItem() {
    const accounts = ethers.getSigners();
    const [deployer, owner, renter] = accounts;

    const ID = {
        [deployer.address]: "DEPLOYER",
        [owner.address]: "OWNER",
        [renter.address]: "RENTER"
    }

    const NFTMPde = await deployments.get("NFTRentalMarketplace")
    const BNFde = await deployments.get("BasicNFT")

    const NFTMarketplaceContract = await ethers.getContractAt(NFTMPde.abi, NFTMPde.address)
    const basicNFTContract = await ethers.getContractAt(BNFde.abi, BNFde.address)

    const listing = await NFTMarketplaceContract.getListing(basicNFTContract.address, TOKEN_ID)

    const price = listing.price.toString()
    const tx = await NFTMarketplaceContract.connect(buyer1).RentItem(basicNFTContract.address, TOKEN_ID, {
        value: price,
        expiry: Math.round(new Date().getTime() / 1000) + 600
    })

    await tx.wait();
    console.log("NFT Rented!")

    const newUser = await basicNFTContract.userOf(TOKEN_ID)
    console.log(`New owner of Token ID ${TOKEN_ID} is ${newUser} with identity of ${ID[newOwner]}`)
}