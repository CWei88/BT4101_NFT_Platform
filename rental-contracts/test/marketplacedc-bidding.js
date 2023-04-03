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


describe("Bidding Test", function() {
    beforeEach(async function() {
        await network.provider.send("hardhat_reset")
    })

    it("Bid rejection", async() => {
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

        let bidderBalance = await ethers.provider.getBalance(renter.address);
        bidderBalance = bidderBalance.toString();
        const bidRejected = await marketplace.connect(owner).rejectBid(nftAddress3, tokenId3, renter.address);

        let postBalance = await ethers.provider.getBalance(renter.address);
        postBalance = postBalance.toString();

        let currBids = await marketplace.connect(owner).getAllBids(nftAddress3, tokenId3);
        expect(currBids.length).to.equal(1);
        expect(currBids[0].rentee).to.equal(sign.address);
        expect(currBids[0].totalBid).to.equal(40);

        let myBids = await marketplace.connect(renter).getMyBids();
        expect(myBids.length).to.equal(1);
        expect(myBids[0].contractAddress).to.equal(nftAddress);
        expect(myBids[0].tokenId).to.equal(tokenId);

        expect(BigInt(postBalance)).to.equal(BigInt(bidderBalance) + 30n);
    })

    it("Bid withdrawal", async() => {
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
        
        let bidderBalance = await ethers.provider.getBalance(renter.address);
        bidderBalance = bidderBalance.toString();
        const bidWithdrawn = await marketplace.connect(renter).withdrawBid(nftAddress3, tokenId3);
        const withdrawRecp = await bidWithdrawn.wait();

        let postBalance = await ethers.provider.getBalance(renter.address);
        postBalance = postBalance.toString();

        let currBids = await marketplace.connect(owner).getAllBids(nftAddress3, tokenId3);
        expect(currBids.length).to.equal(1);
        expect(currBids[0].rentee).to.equal(sign.address);
        expect(currBids[0].totalBid).to.equal(40);

        let myBids = await marketplace.connect(renter).getMyBids();
        expect(myBids.length).to.equal(1);
        expect(myBids[0].contractAddress).to.equal(nftAddress);
        expect(myBids[0].tokenId).to.equal(tokenId);

        console.log(bidderBalance)
        console.log(postBalance)

        const withdrawnGas = BigInt(withdrawRecp.cumulativeGasUsed) * BigInt(withdrawRecp.effectiveGasPrice);

        expect(BigInt(postBalance)).to.equal(BigInt(bidderBalance) + 30n - BigInt(withdrawnGas));

    })

})