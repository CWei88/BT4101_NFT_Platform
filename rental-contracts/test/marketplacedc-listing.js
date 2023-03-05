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

describe("Marketplace Test", function() {
    beforeEach(async function() {
        await network.provider.send("hardhat_reset")
    })

    it("Listing Token", async() => {
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

        let expiryTime = Math.round(new Date().getTime() / 1000) + (1*24*60*60);
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 0, 1, expiryTime, {value: 1});
        await listNFT.wait();
        console.log(`Listed NFT ${tokenId}`);
        await expect(listNFT).to.emit(marketplace, "TokenListed").withArgs(nftAddress, tokenId, 10, 0, 1, expiryTime)
    
    })

    it("Rent NFT", async() => {
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

        let expiryTime = Math.round(new Date().getTime() / 1000) + (1*24*60*60)
        
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

        let newUser = await rentableNFT.userOf(tokenId);
        expect(newUser).to.equal(ethers.constants.AddressZero);
        console.log("Rental has expired!");
    })

    it("Delist NFT", async() => {
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
        await expect(marketplace.connect(renter).delistNFT(nftAddress, tokenId)).to.be.revertedWith("Only owner can delist");
        await expect(marketplace.connect(owner).delistNFT(nftAddress, tokenId)).to.be.revertedWith("Token is rented out");
        
        await network.provider.send('evm_increaseTime', [86410])
        await network.provider.send('evm_mine')

        const delist = await marketplace.connect(owner).delistNFT(nftAddress, tokenId);
        await expect(delist).to.emit(marketplace, "TokenDelisted").withArgs(nftAddress, tokenId, false);
        console.log("NFT successfully delisted.")

    })

    it("Claim NFT", async() => {
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

        let expiryTime = Math.round(new Date().getTime() / 1000) + (3*24*60*60);
        
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

        const delist = await marketplace.connect(owner).delistNFT(nftAddress, tokenId);
        await expect(delist).to.emit(marketplace, "TokenDelisted").withArgs(nftAddress, tokenId, false);
        console.log("NFT successfully delisted.");

        const claim = await marketplace.connect(owner).claimNFT(nftAddress, tokenId);
        await claim.wait();
        await expect(claim).to.emit(marketplace, 'TokenClaimed').withArgs(nftAddress, tokenId, owner.address);
        console.log(`NFT ${tokenId} claimed`);

        let tokenOwner = await rentableNFT.ownerOf(tokenId);
        expect(tokenOwner).to.equal(owner.address);
        console.log("NFT transferred correctly");
    })
})

