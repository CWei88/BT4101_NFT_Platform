const { ethers, network } = require('hardhat');
const { expect } = require('chai');

const setUpMarketplace = async() => {
    const acc = await ethers.getSigners();
    const mktplaceOwner = acc[2];
    const mktplace = await ethers.getContractFactory("MarketplaceDC");
    const mplace = await mktplace.deploy(mktplaceOwner.address, mktplaceOwner.address, 1, 10);
    await mplace.deployed();
    return mplace;
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

describe("Test Marketplace Getters", function() {
    beforeEach(async function() {
        await network.provider.send("hardhat_reset")
    })

    it("Get Listings", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();
    
        //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tx2 = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes2 = await tx2.wait()

        const tx3 = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes3 = await tx3.wait()

        const tx4 = await rentableNFT.connect(renter).mint(renter.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes4 = await tx4.wait()
    
        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        const tokenId2 = txRes2.events[0].args.tokenId
        let nftAddress2 = txRes2.events[0].address.toString();

        const tokenId3 = txRes3.events[0].args.tokenId
        let nftAddress3 = txRes3.events[0].address.toString();

        const tokenId4 = txRes4.events[0].args.tokenId
        let nftAddress4 = txRes4.events[0].address.toString();
    
        await rentableNFT.approve(marketplace.address, tokenId);
        await rentableNFT.approve(marketplace.address, tokenId2);
        await rentableNFT.approve(marketplace.address, tokenId3);
        await rentableNFT.connect(renter).approve(marketplace.address, tokenId4);

        let expiryTime = Math.round(new Date().getTime() / 1000) + (1*24*60*60)
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, expiryTime, false, {value: 1});
        await listNFT.wait();

        const listNFT2 = await marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 0, 1, expiryTime, false, {value: 1});
        await listNFT2.wait();

        const listNFT3 = await marketplace.connect(owner).listNFT(nftAddress3, tokenId3, 10, 0, 1, expiryTime, false, {value: 1});
        await listNFT3.wait();

        const listNFT4 = await marketplace.connect(renter).listNFT(nftAddress4, tokenId4, 10, 0, 1, expiryTime, false, {value: 1});
        await listNFT4.wait();

        let lister = await marketplace.getAllListings();
        expect(lister.length).to.equal(4);

        let firstListing = lister[0];
        expect(firstListing.contractAddress).to.equal(nftAddress);
        expect(firstListing.tokenId).to.equal(tokenId);
        console.log("FirstListing correct")

        let secondListing = lister[1]
        expect(secondListing.contractAddress).to.equal(nftAddress2);
        expect(secondListing.tokenId).to.equal(tokenId2);
        console.log("Second Listing correct!")

        let thirdListing = lister[2]
        expect(thirdListing.contractAddress).to.equal(nftAddress3);
        expect(thirdListing.tokenId).to.equal(tokenId3);
        console.log("Third Listing Correct!")

        const delist2 = await marketplace.connect(owner).delistNFT(nftAddress2, tokenId2);
        await expect(delist2).to.emit(marketplace, "TokenDelisted").withArgs(nftAddress2, tokenId2, false);

        let lister2 = await marketplace.getAvailableListings();
        expect(lister2.length).to.equal(3);

        const claim = await marketplace.connect(owner).claimNFT(nftAddress2, tokenId2);
        await claim.wait();

        let lister3 = await marketplace.getAllListings();
        expect(lister3.length).to.equal(4);
        
        let deletedNFT = lister3[1];
        expect(deletedNFT.contractAddress).to.equal(ethers.constants.AddressZero);
        expect(deletedNFT.tokenId).to.equal(0);

        let ownedListingOwner = await marketplace.connect(owner).getOwnedListings();
        expect(ownedListingOwner.length).to.equal(2);
        expect(ownedListingOwner[0].contractAddress).to.equal(nftAddress);

        let ownedListingUser = await marketplace.connect(renter).getOwnedListings();
        expect(ownedListingUser.length).to.equal(1);
        expect(ownedListingUser[0].contractAddress).to.equal(nftAddress4);
    })

    it("Get Listing Fee", async() => {
        const marketplace = await setUpMarketplace();
        const acc = await ethers.getSigners();
        const mktplaceOwner = acc[2];

        let listingFee = await marketplace.getListingFee();
        expect(listingFee).to.equal(1);

        let updateFee = await marketplace.connect(mktplaceOwner).updateFee(5);
        expect(updateFee).to.emit(marketplace, "FeeUpdated").withArgs(1, 5, mktplaceOwner.address);
        let newListingFee = await marketplace.getListingFee();
        expect(newListingFee).to.equal(5);
    })

    it("Get Rented tokens", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();
    
        //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tx2 = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes2 = await tx2.wait()

        const tx3 = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes3 = await tx3.wait()
    
        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        const tokenId2 = txRes2.events[0].args.tokenId
        let nftAddress2 = txRes2.events[0].address.toString();

        const tokenId3 = txRes3.events[0].args.tokenId
        let nftAddress3 = txRes3.events[0].address.toString();
    
        await rentableNFT.approve(marketplace.address, tokenId);
        await rentableNFT.approve(marketplace.address, tokenId2);
        await rentableNFT.approve(marketplace.address, tokenId3);

        let testExpiry = Math.round(new Date().getTime() / 1000) + (3*24*60*60)
        let expiryTime = Math.round(new Date().getTime() / 1000) + (1*24*60*60)
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, expiryTime, true, {value: 1});
        await listNFT.wait();

        const listNFT2 = await marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 0, 3, testExpiry, true, {value: 1});
        await listNFT2.wait();

        const listNFT3 = await marketplace.connect(owner).listNFT(nftAddress3, tokenId3, 10, 0, 3, expiryTime, true, {value: 1});
        await listNFT3.wait();

        const rental = await marketplace.connect(renter).rentNFT(nftAddress, tokenId, 1, {value: 10})
        await rental.wait();

        const rental2 = await marketplace.connect(renter).rentNFT(nftAddress2, tokenId2, 2, {value: 20})
        await rental2.wait();

        let currentRentals = await marketplace.getCurrentlyRented();
        expect(currentRentals.length).to.equal(2);

        await network.provider.send('evm_increaseTime', [86410])
        await network.provider.send('evm_mine')

        const delist = await marketplace.connect(owner).delistNFT(nftAddress, tokenId);
        await expect(delist).to.emit(marketplace, "TokenDelisted").withArgs(nftAddress, tokenId, false);

        let newRentals = await marketplace.getCurrentlyRented();
        expect(newRentals.length).to.equal(1);

        let r = newRentals[0];
        expect(r.rentee).to.equal(renter.address);

    })

    
    it("Get renter bids", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();
        const newAcc = await ethers.getSigners();
        const sign = newAcc[2];

        //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tx2 = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes2 = await tx2.wait()

        const tx3 = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes3 = await tx3.wait()
    
        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        const tokenId2 = txRes2.events[0].args.tokenId
        let nftAddress2 = txRes2.events[0].address.toString();

        const tokenId3 = txRes3.events[0].args.tokenId
        let nftAddress3 = txRes3.events[0].address.toString();
    
        await rentableNFT.approve(marketplace.address, tokenId);
        await rentableNFT.approve(marketplace.address, tokenId2);
        await rentableNFT.approve(marketplace.address, tokenId3);

        let testExpiry = Math.round(new Date().getTime() / 1000) + (4*24*60*60)
        let expiryTime = Math.round(new Date().getTime() / 1000) + (2*24*60*60)
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, expiryTime, false, {value: 1});
        await listNFT.wait();

        const listNFT2 = await marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 0, 3, testExpiry, false, {value: 1});
        await listNFT2.wait();

        const listNFT3 = await marketplace.connect(owner).listNFT(nftAddress3, tokenId3, 10, 0, 3, expiryTime, false, {value: 1});
        await listNFT3.wait();

        const bidNFT = await marketplace.connect(renter).bidNFT(nftAddress, tokenId, 1, {value: 25});
        const bidRecp = await bidNFT.wait()
        expect(bidNFT).to.emit(marketplace, "TokenBid").withArgs(nftAddress, tokenId, 1, 25);

        const bidNFT2 = await marketplace.connect(renter).bidNFT(nftAddress3, tokenId3, 2, {value: 30})
        await bidNFT2.wait();
        expect(bidNFT2).to.emit(marketplace, "TokenBid").withArgs(nftAddress3, tokenId3, 2, 30);

        const bidNFT3 = await marketplace.connect(sign).bidNFT(nftAddress3, tokenId3, 2, {value: 40})
        await bidNFT3.wait();
        expect(bidNFT3).to.emit(marketplace, "TokenBid").withArgs(nftAddress3, tokenId3, 2, 40);

        let numBids = await marketplace.connect(renter).getMyBids();
        expect(numBids.length).to.equal(2);
        expect(numBids[0].contractAddress).to.equal(nftAddress)
        expect(numBids[0].tokenId).to.equal(tokenId)

        expect(numBids[1].totalBid).to.equal(30);
        expect(numBids[1].rentalDays).to.equal(2);

        const acceptRental = await marketplace.connect(owner).acceptBid(nftAddress3, tokenId3, sign.address);

        let newNumBids = await marketplace.connect(renter).getMyBids();
        expect(newNumBids.length).to.equal(1);
    })

    it("Get comissionBalance", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();
        const accounts = await ethers.getSigners();
        let mOwner = accounts[2];
    
        //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tx2 = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes2 = await tx2.wait()

        const tx3 = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes3 = await tx3.wait()

        const tx4 = await rentableNFT.connect(renter).mint(renter.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes4 = await tx4.wait()
    
        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        const tokenId2 = txRes2.events[0].args.tokenId
        let nftAddress2 = txRes2.events[0].address.toString();

        const tokenId3 = txRes3.events[0].args.tokenId
        let nftAddress3 = txRes3.events[0].address.toString();

        const tokenId4 = txRes4.events[0].args.tokenId
        let nftAddress4 = txRes4.events[0].address.toString();
    
        await rentableNFT.approve(marketplace.address, tokenId);
        await rentableNFT.approve(marketplace.address, tokenId2);
        await rentableNFT.approve(marketplace.address, tokenId3);
        await rentableNFT.connect(renter).approve(marketplace.address, tokenId4);

        let expiryTime = Math.round(new Date().getTime() / 1000) + (1*24*60*60)
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, expiryTime, true, {value: 1});
        await listNFT.wait();

        const listNFT2 = await marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 0, 1, expiryTime, false, {value: 1});
        await listNFT2.wait();

        const listNFT3 = await marketplace.connect(owner).listNFT(nftAddress3, tokenId3, 10, 0, 1, expiryTime, true, {value: 1});
        await listNFT3.wait();

        const listNFT4 = await marketplace.connect(renter).listNFT(nftAddress4, tokenId4, 10, 0, 1, expiryTime, false, {value: 1});
        await listNFT4.wait();

        let currBalance = await marketplace.connect(mOwner).getComissionBalance();
        expect(currBalance.toNumber()).to.equal(4);

        let withdraw = await marketplace.connect(mOwner).withdrawComission();
        await withdraw.wait();
        expect(withdraw).to.emit(marketplace, "ComissionWithdrawn").withArgs(mOwner.address, 4);

        let newBalance = await marketplace.connect(mOwner).getComissionBalance();
        expect(newBalance.toNumber()).to.equal(0)
    })
})