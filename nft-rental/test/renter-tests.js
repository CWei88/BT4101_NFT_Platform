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
    const [owner, renter] = await setupAccounts();

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();

    await rentableNFT.approveUser(NFTRM.address);

    const tx = await rentableNFT.connect(owner).mint(1, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    const txRes = await tx.wait();

    const tokenId = txRes.events[0].args.tokenId
    console.log(tokenId)

    let nftAddress = txRes.events[0].address.toString();

    let expiryDate = Math.round(new Date().getTime() / 1000) + 600
    const lis = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, expiryDate, expiryDate, {value: listingFee})
    await lis.wait()

    console.log("Listed Test NFT");

    //Rent NFT to renter for 10 minutes
    await NFTRM.connect(renter).rentNFT(tokenId, {value: 1})
    console.log("Rented Test NFT")

    //Check Renter userId
    const renterOf = await NFTRM.connect(renter).getMyNFTs();
    const rOf = renterOf[0][4]
    expect(rOf).to.equal(renter.address);
    console.log("Renter is correct!")

    let p1 = await ethers.getSigners();
    const person1 = p1[2];

    await expect(rentableNFT.connect(renter)["safeTransferFrom(address,address,uint256)"](renter.address, person1.address, tokenId)).to.be.revertedWith("ERC721: caller is not token owner or approved");

})

it("Renter should be unable to list and delist", async() => {
    const NFTRM = await setupMarketplace();
    const rentableNFT = await setupContract();
    const [owner, renter] = await setupAccounts();

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();
    console.log(listingFee)

    await rentableNFT.approveUser(NFTRM.address);

    const tx = await rentableNFT.connect(owner).mint(1, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    const txRes = await tx.wait();

    const tokenId = txRes.events[0].args.tokenId
    console.log(tokenId)

    let nftAddress = txRes.events[0].address.toString();

    let expiryDate = Math.round(new Date().getTime() / 1000) + 600
    const lis = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, expiryDate, expiryDate, {value: (listingFee)})
    await lis.wait()

    console.log("Listed Test NFT");

    //Rent NFT to renter for 10 minutes
    await NFTRM.connect(renter).rentNFT(tokenId, {value: 1})
    console.log("Rented Test NFT")

    //Check Renter userId
    const renterOf = await NFTRM.connect(renter).getMyNFTs();
    const rOf = renterOf[0][4]
    expect(rOf).to.equal(renter.address);
    console.log("Renter is correct!")

    await expect(NFTRM.connect(renter).listNFT(nftAddress, tokenId, 2, expiryDate - 100, expiryDate - 100, {value: (listingFee)}))
    .to.be.revertedWith("ERC721: Caller is not owner or approved");

    await expect(NFTRM.connect(renter).delistNFT(nftAddress, tokenId)).to.be.revertedWith("Only NFT owner can delist")

})

it("Check tokenofOwner to include rental NFTs", async() => { 
    const NFTRM = await setupMarketplace();
    const rentableNFT = await setupContract();
    const [owner, renter] = await setupAccounts();

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();
    console.log(listingFee);

    await rentableNFT.approveUser(NFTRM.address);

    const tx = await rentableNFT.connect(owner).mint(1, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    const txRes = await tx.wait();

    const tokenId = txRes.events[0].args.tokenId
    console.log(tokenId)

    let nftAddress = txRes.events[0].address.toString();

    let expiryDate = Math.round(new Date().getTime() / 1000) + 600
    const lis = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, expiryDate, expiryDate, {value: listingFee})
    await lis.wait()

    console.log("Listed Test NFT");

    //Rent NFT to renter for 10 minutes
    await NFTRM.connect(renter).rentNFT(tokenId, {value: 1})
    console.log("Rented Test NFT")

    //Check Renter userId
    const renterOf = await NFTRM.connect(renter).getMyNFTs();
    const rOf = renterOf[0][4]
    expect(rOf).to.equal(renter.address);
    console.log("Renter is correct!")

    //Checks that 1 token is listed for Renter
    expect(await rentableNFT.balanceOf(renter.address)).to.equal(1);

    let rentalId = await rentableNFT.tokenOfOwnerByIndex(renter.address, 0);
    expect(rentalId).to.equal(tokenId);

    await expect(rentableNFT.tokenOfOwnerByIndex(renter.address, 1)).to.be.revertedWith("ERC4907: Index out of bounds")

    await network.provider.send('evm_increaseTime', [610])
    await network.provider.send('evm_mine')

    let postRentalCount = await rentableNFT.balanceOf(renter.address);
    expect(postRentalCount).to.equal(0)

    await expect(rentableNFT.tokenOfOwnerByIndex(renter.address, 0)).to.be.revertedWith("ERC4907: Index out of bounds")
})
