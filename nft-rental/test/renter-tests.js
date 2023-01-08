const { ethers, network } = require('hardhat');
const { expect } = require('chai');

const setupMarketplace = async () => {
    const RentableNFT = await ethers.getContractFactory("NFTRM")
    const rNFT = await RentableNFT.deploy();
    await rNFT.deployed();
    return rNFT;
}

const setupContract = async () => {
    const RentableNFT = await ethers.getContractFactory("RentableNFT")
    const rNFT = await RentableNFT.deploy("RentableNFT", "RNFT");
    await rNFT.deployed();
    return rNFT;
}

const setupAccounts = async () => {
    const accounts = await ethers.getSigners();
    return [accounts[0], accounts[1]];
}

const setUpERC721 = async() => {
    const DiffNFT = await ethers.getContractFactory("DiffTypeNFT")
    const rNFT = await DiffNFT.deploy();
    await rNFT.deployed();
    return rNFT;
}

it("Renter should not transfer", async() => {
    const NFTRM = await setupMarketplace();
    const rentableNFT = await setupContract();
    const [owner, renter, person1] = await setupAccounts();

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();

    await rentableNFT.approveUser(NFTRM.address);

    const tx = await rentableNFT.connect(owner).mint(1, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    const txRes = await tx.wait();

    const tokenId = txRes.events[0].args.tokenId
    console.log(tokenId)

    let nftAddress = txRes.events[0].address.toString();

    const lis = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 600, {value: listingFee})
    await lis.wait()

    console.log("Listed Test NFT");

    //Rent NFT to renter for 10 minutes
    await NFTRM.rentNFT(tokenId, renter.address, {value: 1})
    console.log("Rented Test NFT")

    //Check Renter userId
    const renterOf = await NFTRM.connect(renter).getMyNFTs();
    const rOf = renterOf[0][4]
    expect(rOf).to.equal(renter.address);
    console.log("Renter is correct!")

    await expect(rentableNFT.safeTransferFrom(renter, person1, tokenId)).to.be.revertedWith("ERC721: caller is not token owner or approved");

})

it("Renter should be unable to list and delist", async() => {
    const NFTRM = await setupMarketplace();
    const rentableNFT = await setupContract();
    const [owner, renter] = await setupAccounts();

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();

    await rentableNFT.approveUser(NFTRM.address);

    const tx = await rentableNFT.connect(owner).mint(1, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    const txRes = await tx.wait();

    const tokenId = txRes.events[0].args.tokenId
    console.log(tokenId)

    let nftAddress = txRes.events[0].address.toString();

    const lis = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 600, {value: listingFee})
    await lis.wait()

    console.log("Listed Test NFT");

    //Rent NFT to renter for 10 minutes
    await NFTRM.rentNFT(tokenId, renter.address, {value: 1})
    console.log("Rented Test NFT")

    //Check Renter userId
    const renterOf = await NFTRM.connect(renter).getMyNFTs();
    const rOf = renterOf[0][4]
    expect(rOf).to.equal(renter.address);
    console.log("Renter is correct!")

    await expect(rentableNFT.connect(renter).listNFT(nftAddress, tokenId, 2, Math.round(new Date().getTime()/1000) + 500, {value: listingFee}))
    .to.be.revertedWith("ERC721: caller is not token owner or approved");

    await expect(rentableNFT.connect(renter).delistNFT(nftAddress, tokenId)).to.be.revertedWith("Only NFT owner can delist")

})

it("Check tokenofOwner to include rental NFTs", async() => { 
    const NFTRM = await setupMarketplace();
    const rentableNFT = await setupContract();
    const [owner, renter] = await setupAccounts();

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();

    await rentableNFT.approveUser(NFTRM.address);

    const tx = await rentableNFT.connect(owner).mint(1, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    const txRes = await tx.wait();

    const tokenId = txRes.events[0].args.tokenId
    console.log(tokenId)

    let nftAddress = txRes.events[0].address.toString();

    const lis = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 600, {value: listingFee})
    await lis.wait()

    console.log("Listed Test NFT");

    //Rent NFT to renter for 10 minutes
    await NFTRM.rentNFT(tokenId, renter.address, {value: 1})
    console.log("Rented Test NFT")

    //Check Renter userId
    const renterOf = await NFTRM.connect(renter).getMyNFTs();
    const rOf = renterOf[0][4]
    expect(rOf).to.equal(renter.address);
    console.log("Renter is correct!")

    let rentalId = rentableNFT.tokenOfOwnerByIndex(renter, 1);
    expect(rentalId).to.equal(tokenId);
})
