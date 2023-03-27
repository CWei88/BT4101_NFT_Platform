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

const setupERC721 = async () => {
    const DiffNFT = await ethers.getContractFactory("DiffTypeNFT")
    const rNFT = await DiffNFT.deploy();
    await rNFT.deployed();
    return rNFT;
}

describe("Marketplace Errors", function() { 
    beforeEach(async function() {
        await network.provider.send("hardhat_reset")
    })
    
    it("Listing errors", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();
        const DNFT = await setupERC721();
    
        //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tx2 = await DNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes2 = await tx2.wait();
    
        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        const tokenId2 = txRes2.events[0].args.tokenId
        console.log(tokenId2)
        let nftAddress2 = txRes2.events[0].address.toString();
    
        await rentableNFT.approve(marketplace.address, tokenId);
        let expiryTime = Math.round(new Date().getTime() / 1000) + (1*24*60*60)

        await expect(marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, expiryTime, {value: 0}))
        .to.be.revertedWith("Not enough ETH to pay for platform fees")
        console.log("ETH error tested successfully!")

        await expect(marketplace.connect(owner).listNFT(nftAddress, tokenId, 0, 0, 1, expiryTime, {value: 1}))
        .to.be.revertedWith("Price must be higher than zero");
        console.log("Listing price error successfully tested.")

        let falseExpiry = Math.round(new Date().getTime() / 1000) - 100

        await expect(marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, falseExpiry, {value: 1}))
        .to.be.revertedWith("Listing expiry must be longer than current time.");
        console.log("Listing expiry successfully tested.")

        await expect(marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 0, 1, expiryTime, {value: 1}))
        .to.be.revertedWith("Token is not ERC4907, please wrap token")
        console.log("Token version checked.")
    })

    it("Rent Errors", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();

        //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tx2 = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes2 = await tx2.wait();
    
        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        const tokenId2 = txRes2.events[0].args.tokenId
        console.log(tokenId2)
        let nftAddress2 = txRes2.events[0].address.toString();
    
        await rentableNFT.approve(marketplace.address, tokenId);
        await rentableNFT.approve(marketplace.address, tokenId2);
        let expiryTime = Math.round(new Date().getTime() / 1000) + (1*24*60*60)
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 1, 3, expiryTime, {value: 1});
        await listNFT.wait();
        console.log(`Listed NFT ${tokenId}`);
        await expect(listNFT).to.emit(marketplace, "TokenListed").withArgs(nftAddress, tokenId, 10, 1, 3, expiryTime)

        const listNFT2 = await marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 1, 3, expiryTime, {value: 1});
        await listNFT2.wait();
        console.log(`Listed NFT ${tokenId2}`);
        await expect(listNFT2).to.emit(marketplace, "TokenListed").withArgs(nftAddress2, tokenId2, 10, 1, 3, expiryTime)

        await expect(marketplace.connect(renter).rentNFT(nftAddress, tokenId, 0, {value: 10})).to.be.revertedWith("Cannot rent for less than minimum")
        await expect(marketplace.connect(renter).rentNFT(nftAddress, tokenId, 4, {value: 10})).to.be.revertedWith("Cannot rent for more than maximum")
        console.log("Rental Duration Tested")

        await expect(marketplace.connect(renter).rentNFT(nftAddress, tokenId, 2, {value: 10})).to.be.revertedWith("Insufficient ether to pay for rental")
        console.log("Cost Tested")

        const delist = await marketplace.connect(owner).delistNFT(nftAddress, tokenId);
        await expect(delist).to.emit(marketplace, "TokenDelisted").withArgs(nftAddress, tokenId, false);
        console.log("NFT successfully delisted.");

        await expect(marketplace.connect(renter).rentNFT(nftAddress, tokenId, 2, {value: 20})).to.be.revertedWith("Token is not available for Rental");
        console.log("Rental after Delisting Tested");

        const rental = await marketplace.connect(renter).rentNFT(nftAddress2, tokenId2, 1, {value: 10});
        await rental.wait();

        const accounts = await ethers.getSigners();
        let acc = accounts[3]
        await expect(marketplace.connect(acc).rentNFT(nftAddress2, tokenId2, 1, {value: 10})).to.be.revertedWith("Token has been rented out");
        console.log("Double Renting Tested");

        await network.provider.send('evm_increaseTime', [86410])
        await network.provider.send('evm_mine')
        await expect(marketplace.connect(renter).rentNFT(nftAddress2, tokenId2, 2, {value: 20})).to.be.revertedWith("Listing has expired")
        console.log("Listing Expiry Tested")

    })

    it("Bid Errors", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();

        //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();
    
        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        await rentableNFT.approve(marketplace.address, tokenId);
        let expiryTime = Math.round(new Date().getTime() / 1000) + (2*24*60*60);
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 1, 3, expiryTime, {value: 1});
        await listNFT.wait();
        console.log(`Listed NFT ${tokenId}`);
        await expect(listNFT).to.emit(marketplace, "TokenListed").withArgs(nftAddress, tokenId, 10, 1, 3, expiryTime);

        await expect(marketplace.connect(owner).bidNFT(nftAddress, tokenId, 2, {value: 25})).to.be.revertedWith("Owner cannot bid for their own NFTs");
        await expect(marketplace.connect(renter).bidNFT(nftAddress, tokenId, 0, {value: 25})).to.be.revertedWith("Rental Days cannot be shorter than minimum");
        await expect(marketplace.connect(renter).bidNFT(nftAddress, tokenId, 4, {value: 25})).to.be.revertedWith("Rental Days cannot be longer than maximum");
        await expect(marketplace.connect(renter).bidNFT(nftAddress, tokenId, 3, {value: 25})).to.be.revertedWith("Bid lower than minimum rental price!");
        console.log("Bids Tested");

        let successBid = await marketplace.connect(renter).bidNFT(nftAddress, tokenId, 2, {value:20});
        await successBid.wait();
        expect(successBid).to.emit(marketplace, "TokenBid").withArgs(nftAddress, tokenId, 2, 25);

        await expect(marketplace.connect(renter).acceptBid(nftAddress, tokenId, renter.address)).to.be.revertedWith("Caller is not token owner");
        console.log("Rouge acceptance tested");

        let realAcceptance = await marketplace.connect(owner).acceptBid(nftAddress, tokenId, renter.address);
        await realAcceptance.wait();

        const accounts = await ethers.getSigners();
        let acc = accounts[3]
        await expect(marketplace.connect(acc).rentNFT(nftAddress, tokenId, 1, {value: 10})).to.be.revertedWith("Token has been rented out");
        console.log("Bidding after renting tested.");

        //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
        const tx2 = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes2 = await tx2.wait();
    
        const tokenId2 = txRes2.events[0].args.tokenId
        console.log(tokenId2)
        let nftAddress2 = txRes2.events[0].address.toString();

        await rentableNFT.approve(marketplace.address, tokenId2);

        const listNFT2 = await marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 1, 3, expiryTime, {value: 1});
        await listNFT2.wait();
        console.log(`Listed NFT ${tokenId2}`);
        await expect(listNFT2).to.emit(marketplace, "TokenListed").withArgs(nftAddress2, tokenId2, 10, 1, 3, expiryTime);

        const delist = await marketplace.connect(owner).delistNFT(nftAddress2, tokenId2);
        await expect(delist).to.emit(marketplace, "TokenDelisted").withArgs(nftAddress2, tokenId2, false);
        console.log("NFT successfully delisted.");

        await expect(marketplace.connect(acc).bidNFT(nftAddress2, tokenId2, 2, {value:20})).to.be.revertedWith("Token is not available for Rental");
        console.log("Bidding after delisting tested.")

    })

    it("Delist Errors", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();

        //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();
    
        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();
    
        await rentableNFT.approve(marketplace.address, tokenId);

        let listTiming = Math.round(new Date().getTime() / 1000) + (2*24*60*60)
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, listTiming, {value: 1});
        await listNFT.wait();
        console.log(`Listed NFT ${tokenId}`);
        await expect(listNFT).to.emit(marketplace, "TokenListed").withArgs(nftAddress, tokenId, 10, 0, 1, listTiming)

        const rental = await marketplace.connect(renter).rentNFT(nftAddress, tokenId, 1, {value: 10})
        await rental.wait();

        console.log(`Rented NFT ${tokenId}`);
        await expect(rental).to.emit(marketplace, "TokenRented").withArgs(nftAddress, tokenId, renter.address, 1, 10, renter.address);

        let user = await rentableNFT.userOf(tokenId);
        expect(user).to.equal(renter.address);
        console.log("Rental is correct");
        await expect(marketplace.connect(renter).delistNFT(nftAddress, tokenId)).to.be.revertedWith("Only owner can delist");
        await expect(marketplace.connect(owner).delistNFT(nftAddress, tokenId)).to.be.revertedWith("Token is rented out");
    })

    it("Claim Errors", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();

        //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();
    
        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();
    
        await rentableNFT.approve(marketplace.address, tokenId);

        let expiryTime = Math.round(new Date().getTime() / 1000) + (2*24*60*60)
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, expiryTime, {value: 1});
        await listNFT.wait();
        console.log(`Listed NFT ${tokenId}`);
        await expect(listNFT).to.emit(marketplace, "TokenListed").withArgs(nftAddress, tokenId, 10, 0, 1, expiryTime)

        const rental = await marketplace.connect(renter).rentNFT(nftAddress, tokenId, 1, {value: 10})
        await rental.wait();

        console.log(`Rented NFT ${tokenId}`);
        await expect(rental).to.emit(marketplace, "TokenRented").withArgs(nftAddress, tokenId, renter.address, 1, 10, renter.address);

        let user = await rentableNFT.userOf(tokenId);
        expect(user).to.equal(renter.address);
        console.log("Rental is correct");

        await network.provider.send('evm_increaseTime', [86410])
        await network.provider.send('evm_mine')

        await expect(marketplace.connect(owner).claimNFT(nftAddress, tokenId)).to.be.revertedWith("Token has not been delisted from market");
        console.log("Claiming before delisting tested")

        const delist = await marketplace.connect(owner).delistNFT(nftAddress, tokenId);
        await expect(delist).to.emit(marketplace, "TokenDelisted").withArgs(nftAddress, tokenId, false);
        console.log("NFT successfully delisted.")

        await expect(marketplace.connect(renter).claimNFT(nftAddress, tokenId)).to.be.revertedWith("Only owner can claim back NFT");
        console.log("Renter Claim Tested")

        const claim = await marketplace.connect(owner).claimNFT(nftAddress, tokenId);
        await claim.wait();
        await expect(claim).to.emit(marketplace, 'TokenClaimed').withArgs(nftAddress, tokenId, owner.address);
        console.log(`NFT ${tokenId} claimed`);

        let tokenOwner = await rentableNFT.ownerOf(tokenId);
        expect(tokenOwner).to.equal(owner.address);
        console.log("NFT transferred correctly");

    })

    it("Test emergency stop", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();

        //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tx2 = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes2 = await tx2.wait();
    
        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        const tokenId2 = txRes2.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress2 = txRes2.events[0].address.toString();
    
        await rentableNFT.approve(marketplace.address, tokenId);
        await rentableNFT.approve(marketplace.address, tokenId2);

        let expiryTime = Math.round(new Date().getTime() / 1000) + (3*24*60*60)

        let listTransaction = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, expiryTime, {value: 1})
        await listTransaction.wait();
        
        const accounts = await ethers.getSigners();
        let acc = accounts[2]
        let callStop = await marketplace.connect(acc).stopAll();

        await expect(marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 0, 1, expiryTime, {value: 1})).to.be.revertedWith("Listing and rental has been halted");
        await expect(marketplace.connect(renter).rentNFT(nftAddress, tokenId, 1, {value: 10})).to.be.revertedWith("Listing and rental has been halted");

        let resumeCall = await marketplace.connect(acc).resumeAll();

        let lis = await marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 0, 1, expiryTime, {value: 1})
        await lis.wait();
        await expect(lis).to.emit(marketplace, "TokenListed").withArgs(nftAddress2, tokenId2, 10, 0, 1, expiryTime)

        let rental = await marketplace.connect(renter).rentNFT(nftAddress, tokenId, 1, {value: 10})
        await rental.wait();
        await expect(rental).to.emit(marketplace, "TokenRented").withArgs(nftAddress, tokenId, renter.address, 1, 10, renter.address);
    })

    it("Test Withdraw Permissions", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();

        //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();
            
        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();
            
        await rentableNFT.approve(marketplace.address, tokenId);
        let expiryTime = Math.round(new Date().getTime() / 1000) + (3*24*60*60)

        let listTransaction = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, expiryTime, {value: 1})
        await listTransaction.wait();

        await expect(marketplace.connect(owner).getComissionBalance()).to.be.revertedWith("No permission to view balance")
        await expect(marketplace.connect(owner).withdrawComission()).to.be.revertedWith("Only feeCollector can withdraw")

        await expect(marketplace.connect(renter).getComissionBalance()).to.be.revertedWith("No permission to view balance")
        await expect(marketplace.connect(renter).withdrawComission()).to.be.revertedWith("Only feeCollector can withdraw")
    })
})