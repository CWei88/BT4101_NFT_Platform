const { ethers, network } = require('hardhat');
const { expect } = require('chai');

const setUpMarketplace = async() => {
    const acc = await ethers.getSigners();
    const mktplaceOwner = acc[2];
    const mktplace = await ethers.getContractFactory("MarketplaceDC");
    const mplace = await mktplace.deploy(mktplaceOwner.address, mktplaceOwner.address, 1);
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
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, Math.round(new Date().getTime() / 1000) + (1*24*60*60), {value: 1});
        await listNFT.wait();

        const listNFT2 = await marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 0, 1, Math.round(new Date().getTime() / 1000) + (1*24*60*60), {value: 1});
        await listNFT2.wait();

        const listNFT3 = await marketplace.connect(owner).listNFT(nftAddress3, tokenId3, 10, 0, 1, Math.round(new Date().getTime() / 1000) + (1*24*60*60), {value: 1});
        await listNFT3.wait();

        let lister = await marketplace.getAllListings();
        expect(lister.length).to.equal(3);

        let firstListing = lister[0];
        expect(firstListing.contractAddress).to.equal(nftAddress);
        expect(firstListing.tokenId).to.equal(tokenId);
        console.log("FirstListing correct")

        let secondListing = lister[1]
        expect(secondListing.contractAddress).to.equal(nftAddress2);
        expect(secondListing.tokenId).to.equal(tokenId2);
        console.log("SecondListing correct!")

        let thirdListing = lister[2]
        expect(thirdListing.contractAddress).to.equal(nftAddress3);
        expect(thirdListing.tokenId).to.equal(tokenId3);
        console.log("Third Listing Correct!")

        const delist2 = await marketplace.connect(owner).delistNFT(nftAddress2, tokenId2);
        await expect(delist2).to.emit(marketplace, "TokenDelisted").withArgs(nftAddress2, tokenId2, false);

        let lister2 = await marketplace.getAvailableListings();
        expect(lister2.length).to.equal(2);

        const claim = await marketplace.connect(owner).claimNFT(nftAddress2, tokenId2);
        await claim.wait();

        let lister3 = await marketplace.getAllListings();
        expect(lister3.length).to.equal(3);
        
        let deletedNFT = lister3[1];
        expect(deletedNFT.contractAddress).to.equal(ethers.constants.AddressZero);
        expect(deletedNFT.tokenId).to.equal(0);
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
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, Math.round(new Date().getTime() / 1000) + (1*24*60*60), {value: 1});
        await listNFT.wait();

        const listNFT2 = await marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 0, 3, testExpiry, {value: 1});
        await listNFT2.wait();

        const listNFT3 = await marketplace.connect(owner).listNFT(nftAddress3, tokenId3, 10, 0, 3, Math.round(new Date().getTime() / 1000) + (1*24*60*60), {value: 1});
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
})