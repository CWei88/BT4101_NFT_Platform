const { ethers } = require("hardhat");
const fs = require("fs");

async function main() { 
    const accounts = await ethers.getSigners();
    const [deployer, owner, buyer1] = accounts;
    
    const Mplace = await ethers.getContractFactory('NFTRM')
    const marketplace = await Mplace.deploy();

    await marketplace.deployed();

    const ID = {
        [deployer.address]: "DEPLOYER",
        [owner.address]: "OWNER",
        [buyer1.address]: "BUYER1",
        [marketplace.address]: "MARKETPLACE"
    }

    //Pull the address and ABI out while you deploy, since that will be key in interacting with the smart contract
    const data = {
        address: marketplace.address,
        abi: JSON.parse(marketplace.interface.format('json'))
    }

    //Writes the ABI and address to marketplace.json
    //Used by frontend files to connect with smart contract
    fs.writeFileSync('./src/NFTRM.json', JSON.stringify(data));

    console.log("Marketplace deployed to: ", marketplace.address)

    const RentableNFT = await ethers.getContractFactory("RentableNFT")
    const rNFT = await RentableNFT.deploy("RentableNFT", "RNFT");
    await rNFT.deployed();

    const NFTdata = {
        address: rNFT.address,
        abi: JSON.parse(rNFT.interface.format('json'))
    }
    console.log("Contract deployed to: ", rNFT.address)

    fs.writeFileSync('./NFT.json', JSON.stringify(NFTdata))

    let token = await rNFT.mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    let tokenRes = await token.wait();

    let listingFee = await marketplace.getListingFee();
    listingFee = listingFee.toString();

    const TOKEN_ID = tokenRes.events[0].args.tokenId
    console.log(TOKEN_ID)

    let nftAddress = tokenRes.events[0].address.toString();
    console.log(nftAddress)

    await rNFT.connect(owner).approve(marketplace.address, TOKEN_ID)

    const listing = await marketplace.connect(owner).listNFT(nftAddress, TOKEN_ID, 1, Math.round(new Date().getTime() / 1000) + 700, Math.round(new Date().getTime() / 1000) + 700, {value: listingFee})
    await listing.wait()

    console.log("Token Listed")

    const tx = await marketplace.connect(buyer1).rentNFT(TOKEN_ID, {value: 1})
    await tx.wait()

    console.log("NFT Rented!")

    const newOwner = await rNFT.ownerOf(TOKEN_ID)
    const newUser = await rNFT.userOf(TOKEN_ID)
    console.log(`New user of Token ID ${TOKEN_ID} is ${newUser} with identity of ${ID[newUser]}`)
    console.log(`Owner of TokenID ${TOKEN_ID} is ${newOwner} with identity of ${ID[newOwner]}`)

}

async function ERC721Rent() {
    const accounts = await ethers.getSigners();
    const [deployer, owner, buyer1] = accounts;
    
    const Mplace = await ethers.getContractFactory('NFTRM')
    const marketplace = await Mplace.deploy();

    await marketplace.deployed();

    const ID = {
        [deployer.address]: "DEPLOYER",
        [owner.address]: "OWNER",
        [buyer1.address]: "BUYER1",
        [marketplace.address]: "MARKETPLACE"
    }

    const DiffTypeNFT = await ethers.getContractFactory("DiffTypeNFT")
    const dNFT = await DiffTypeNFT.deploy();
    await dNFT.deployed();

    const wrapper = await ethers.getContractFactory("ERC4907Wrapper")
    const wrap = await wrapper.deploy(dNFT.address, "wNFT", "WR");
    await wrap.deployed();

    let token = await dNFT.connect(owner).mint('QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    let tokenRes = await token.wait();

    let listingFee = await marketplace.getListingFee();
    listingFee = listingFee.toString();

    const TOKEN_ID = tokenRes.events[0].args.tokenId
    console.log(TOKEN_ID)

    await dNFT.connect(owner).approve(wrap.address, TOKEN_ID)

    const wrapTok = await wrap.connect(owner).wrapToken(TOKEN_ID);
    const wrapTokRes = await wrapTok.wait();

    let nftAddress = wrapTokRes.events[2].address.toString();
    console.log(nftAddress)

    //await dNFT.connect(owner).approve(marketplace.address, TOKEN_ID)
    console.log("dNFT approved")
    await wrap.connect(owner).approve(marketplace.address, TOKEN_ID)
    console.log("wrap approved")

    const listing = await marketplace.connect(owner).listNFT(nftAddress, TOKEN_ID, 1, Math.round(new Date().getTime() / 1000) + 700, Math.round(new Date().getTime() / 1000) + 700, {value: listingFee})
    await listing.wait()

    console.log("Token Listed")

    const tx = await marketplace.connect(buyer1).rentNFT(TOKEN_ID, {value: 1})
    await tx.wait()

    console.log("NFT Rented!")

    const newOwner = await wrap.ownerOf(TOKEN_ID)
    console.log(`Owner of TokenID ${TOKEN_ID} is ${newOwner} with identity of ${ID[newOwner]}`)

}

/*main().then(
    ERC721Rent().then(() => process.exit(0))
    .catch((err) => {
        console.log("ERC721 Rent")
        console.log(err)
        process.exit(1)
    }))
.catch((err) => {
    console.log(err)
    process.exit(1)
})*/

main().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})

