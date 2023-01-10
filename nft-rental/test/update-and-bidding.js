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

it("Listing should be updated by owner only", async() => {
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
    const lis = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, ethers.utils.parseUnits('1', "ether"), expiryDate, expiryDate, {value: listingFee})
    await lis.wait()

    let updatetrans = await NFTRM.connect(owner)["updateNFT(address,uint256,uint256,uint64,uint64)"](nftAddress, tokenId, ethers.utils.parseUnits('2', "ether"), expiryDate+100, expiryDate+100)
    updatetrans.wait();

    let test = await NFTRM.getNFT(tokenId)
    console.log(test["price"])

    expect(test["price"]).to.equal(ethers.utils.parseUnits('2', "ether"));
    expect(test["expiry"]).to.equal(expiryDate + 100)

    //NFT rented out should not be able to be updated.
    //Rent NFT to renter for 10 minutes
    await NFTRM.connect(renter).rentNFT(tokenId, {value: ethers.utils.parseUnits('2', "ether")})
    console.log("Rented Test NFT")

    //Check Renter userId
    const renterOf = await NFTRM.connect(renter).getMyNFTs();
    const rOf = renterOf[0][4]
    expect(rOf).to.equal(renter.address);
    console.log("Renter is correct!")

    await expect(NFTRM.connect(owner)["updateNFT(address,uint256,uint64,uint64)"](nftAddress, tokenId, expiryDate+100, expiryDate+100))
    .to.be.revertedWith("Can only update existing listing!")

    await expect(NFTRM.connect(renter)["updateNFT(address,uint256,uint256)"](nftAddress, tokenId, ethers.utils.parseUnits('1', "ether")))
    .to.be.revertedWith("Only owner can update NFT listing")
})

it("Bid should be submitted and seen only by owner", async() => {
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

    let firstBid = await NFTRM.connect(renter).offerToRent(tokenId, 1, expiryDate)
    firstBid.wait()

    let allBids = await NFTRM.connect(owner).viewAllBids(tokenId)

    expect(allBids.length).to.equal(1)

    let moreUsers = await ethers.getSigners();
    const [person1, person2, person3] = [moreUsers[2], moreUsers[3], moreUsers[4]]

    let secondBid = await NFTRM.connect(person1).offerToRent(tokenId, 2, expiryDate)
    console.log("Second Bid made")

    await expect(NFTRM.connect(person2).offerToRent(tokenId, 0, expiryDate)).to.be.revertedWith("price not enough for NFT")
    await expect(NFTRM.connect(person3).offerToRent(tokenId, 2, expiryDate + 300)).to.be.revertedWith("Offer expiry date is longer than listed date")
    await expect(NFTRM.connect(person3).offerToRent(tokenId, 2, Math.round(new Date().getTime() / 1000) - 100)).to.be.revertedWith("Offer expiry date is earlier than current time")
    console.log("Errors tested")

    allBids = await NFTRM.connect(owner).viewAllBids(tokenId)

    expect(allBids.length).to.equal(2)

    await expect(NFTRM.connect(renter).viewAllBids(tokenId)).to.be.revertedWith("Address not listing party")

})

it("Bid should be accepted by owner and transaction happens", async() => { 

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
    const lis = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, ethers.utils.parseUnits('1', "ether"), expiryDate, expiryDate, {value: listingFee})
    await lis.wait()

    let firstBid = await NFTRM.connect(renter).offerToRent(tokenId, ethers.utils.parseUnits('1', "ether"), expiryDate)
    firstBid.wait()

    let moreUsers = await ethers.getSigners();
    const [person1, person2, person3] = [moreUsers[2], moreUsers[3], moreUsers[4]]

    let secondBid = await NFTRM.connect(person1).offerToRent(tokenId, ethers.utils.parseUnits('2', "ether"), expiryDate)
    console.log("Second Bid made")

    let thirdBid = await NFTRM.connect(person2).offerToRent(tokenId, ethers.utils.parseUnits('1', "ether"), expiryDate - 100)
    console.log("Third bid made")

    let fourthBid = await NFTRM.connect(person3).offerToRent(tokenId, ethers.utils.parseUnits('1', "ether"), expiryDate)
    console.log("Fourth bid made")

    let allBids = await NFTRM.connect(owner).viewAllBids(tokenId)
    console.log("All Bids in")

    let offerAcceptance = await NFTRM.connect(owner).acceptOffer(tokenId, person1.address)
    offerAcceptance.wait()

    //Check Renter userId
    const renterOf = await NFTRM.connect(person1).getMyNFTs();
    console.log(renterOf)
    const rOf = renterOf[0][4]
    expect(rOf).to.equal(person1.address);
    console.log("Renter is correct!")

    //Checks that 1 token is listed for Renter
    expect(await rentableNFT.balanceOf(person1.address)).to.equal(1);

    let rentalId = await rentableNFT.tokenOfOwnerByIndex(person1.address, 0);
    expect(rentalId).to.equal(tokenId);
})

