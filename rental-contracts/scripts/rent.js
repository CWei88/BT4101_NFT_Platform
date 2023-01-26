const { ethers } = require("hardhat");
const fs = require("fs");

async function main() { 
    const accounts = await ethers.getSigners();
    const [deployer, owner, buyer1] = accounts;

    const ID = {
        [deployer.address]: "DEPLOYER",
        [owner.address]: "OWNER",
        [buyer1.address]: "BUYER1"
    }
    
    const Mplace = await ethers.getContractFactory('NFTRM')
    const marketplace = await Mplace.deploy();

    await marketplace.deployed();

    //Pull the address and ABI out while you deploy, since that will be key in interacting with the smart contract
    const data = {
        address: marketplace.address,
        abi: JSON.parse(marketplace.interface.format('json'))
    }

    //Writes the ABI and address to marketplace.json
    //Used by frontend files to connect with smart contract
    fs.writeFileSync('./src/NFTRM.json', JSON.stringify(data));

    console.log("Marketplace deployed!")

    const RentableNFT = await ethers.getContractFactory("RentableNFT")
    const rNFT = await RentableNFT.deploy("RentableNFT", "RNFT");
    await rNFT.deployed();

    const NFTdata = {
        address: rNFT.address,
        abi: JSON.parse(rNFT.interface.format('json'))
    }
    console.log("Contract deployed to: ", rNFT.address)

    fs.writeFileSync('./NFT.json', JSON.stringify(NFTdata))

    await rNFT.approveUser(marketplace.address);

    let token = await rNFT.connect(owner).mint(1, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    let tokenRes = await token.wait();

    let listingFee = await marketplace.getListingFee();
    listingFee = listingFee.toString();

    const TOKEN_ID = tokenRes.events[0].args.tokenId
    console.log(TOKEN_ID)

    let nftAddress = tokenRes.events[0].address.toString();

    const listing = await marketplace.connect(owner).listNFT(nftAddress, TOKEN_ID, 1, Math.round(new Date().getTime() / 1000) + 700, Math.round(new Date().getTime() / 1000) + 700, {value: listingFee})
    await listing.wait()

    const tx = await marketplace.connect(buyer1).rentNFT(TOKEN_ID, {value: 1})
    await tx.wait()

    console.log("NFT Rented!")

    const newOwner = await rNFT.ownerOf(TOKEN_ID)
    const newUser = await rNFT.userOf(TOKEN_ID)
    console.log(`New user of Token ID ${TOKEN_ID} is ${newUser} with identity of ${ID[newUser]}`)

}

main().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})