const { ethers, deployments } = require("hardhat");

const PRICE = ethers.utils.parseEther("0.1");

async function mintAndList() {
    const accounts = await ethers.getSigners();
    const [deployer, owner, buyer1] = accounts;

    const ID = {
        [deployer.address]: "DEPLOYER",
        [owner.address]: "OWNER",
        [buyer1.address]: "BUYER1"

    }

    const NFTMPde = await deployments.get("NFTMarketplace")
    const BNFde = await deployments.get("BasicNFT")

    //const NFTMarketplaceContractFactory = await ethers.getContractFactory("NFTMarketplace")
    //const NMPD = await NFTMarketplaceContractFactory.connect(owner).deploy();
    //const NMPDed = await NMPD.deployed()

    const NFTMarketplaceContract = await ethers.getContractAt(NFTMPde.abi, NFTMPde.address)
    const basicNFTContract = await ethers.getContractAt(BNFde.abi, BNFde.address)

    console.log(`Minting NFT for ${owner.address}`)
    //const mintTx = await basicNFTContract.connect(owner).deploy()
    //const mintTxRecp = await mintTx.deployed()

    const con = await basicNFTContract.connect(owner).mintNFT()
    const conWait = await con.wait();
    const tokenId = conWait.events[0].args.tokenId

    console.log("Approving Marketplace as Owner of NFT...")
    const approvalTx = await basicNFTContract.connect(owner)
    .approve(NFTMarketplaceContract.address, tokenId)
    
    await approvalTx.wait()

    console.log("Listing NFT...")
    const listTx = await NFTMarketplaceContract.connect(owner)
    .listItem(basicNFTContract.address, tokenId, PRICE)

    await listTx.wait();
    console.log("NFT listed with Token ID: ", tokenId.toString())

    const mintedBy = await basicNFTContract.ownerOf(tokenId)
    console.log(`NFT with ID ${tokenId} minted and listed by owner ${mintedBy} with identity ${ID[mintedBy]}`)

}

mintAndList()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err)
        process.exit(1)
    })