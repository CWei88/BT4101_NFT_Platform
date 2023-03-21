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
    const DiffNFT = await ethers.getContractFactory("DiffTypeNFT")
    const rNFT = await DiffNFT.deploy();
    await rNFT.deployed();
    return rNFT;
}

const setupAccounts = async () => {
    const accounts = await ethers.getSigners();
    return [accounts[0], accounts[1]];
}

const setupWrapper = async () => {
    const wrapper = await ethers.getContractFactory("ERC4907Wrapper")
    const acc = await ethers.getSigners();
    const mktplaceOwner = acc[2];
    const wrap = await wrapper.deploy(mktplaceOwner.address, "wrapped NFT", "WNFT");
    await wrap.deployed();
    return wrap;
}

describe("Wrapper Test", function() {
    beforeEach(async function() {
        await network.provider.send("hardhat_reset")
    })

    it("Wrap ERC721 Token", async() => {
        const marketplace = await setUpMarketplace();
        const normNFT = await setupContract();
        const [owner, renter] = await setupAccounts();
        const wrapper = await setupWrapper();

        const tx = await normNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tx2 = await normNFT.connect(renter).mint(renter.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const tx2Res = await tx2.wait();

        const tx3 = await normNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const tx3Res = await tx3.wait();

        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        const tokenId2 = tx2Res.events[0].args.tokenId
        console.log(tokenId2)
        let nftAddress2 = tx2Res.events[0].address.toString();

        const tokenId3 = tx3Res.events[0].args.tokenId
        console.log(tokenId3)
        let nftAddress3 = tx3Res.events[0].address.toString();

        await normNFT.connect(owner).approve(wrapper.address, tokenId);
        await normNFT.connect(renter).approve(wrapper.address, tokenId2);
        await normNFT.connect(owner).approve(wrapper.address, tokenId3);

        let wrapTx = await wrapper.connect(owner).wrapToken(nftAddress, tokenId);
        const wrapTxRes = await wrapTx.wait();

        const wtokenId = wrapTxRes.events[2].args.tokenId;
        console.log(wtokenId)
        let wnftAddress = wrapTxRes.events[2].address.toString();

        expect(wtokenId).to.equal(0);
        let wrappedOwner = await wrapper.getOwner(wnftAddress, wtokenId);
        let origOwner = await normNFT.ownerOf(tokenId);
        expect(wrappedOwner).to.equal(owner.address);
        expect(origOwner).to.equal(wrapper.address);
        expect(nftAddress).to.not.equal(wnftAddress);

        console.log("First wrap done")

        let wrapTx2 = await wrapper.connect(renter).wrapToken(nftAddress2, tokenId2);
        const wrapTxRes2 = await wrapTx2.wait();

        const wtokenId2 = wrapTxRes2.events[2].args.tokenId;
        console.log(wtokenId2)
        let wnftAddress2 = wrapTxRes2.events[2].address.toString();

        expect(wtokenId2).to.equal(1);
        let wrappedOwner2 = await wrapper.getOwner(wnftAddress2, wtokenId2);
        let origOwner2 = await normNFT.ownerOf(tokenId2);
        expect(wrappedOwner2).to.equal(renter.address)
        expect(origOwner2).to.equal(wrapper.address);
        expect(nftAddress2).to.not.equal(wnftAddress2);

        console.log("Second wrap done")

        let wrapTx3 = await wrapper.connect(owner).wrapToken(nftAddress3, tokenId3);
        const wrapTxRes3 = await wrapTx3.wait();

        const wtokenId3 = wrapTxRes3.events[2].args.tokenId;
        console.log(wtokenId3)
        let wnftAddress3 = wrapTxRes3.events[2].address.toString();

        expect(wtokenId3).to.equal(2);
        let wrappedOwner3 = await wrapper.getOwner(wnftAddress3, wtokenId3);
        let origOwner3= await normNFT.ownerOf(tokenId3);
        expect(wrappedOwner3).to.equal(owner.address)
        expect(origOwner3).to.equal(wrapper.address);
        expect(nftAddress3).to.not.equal(wnftAddress3);

        console.log("All wrap done!")

    })

    it("Unwrap ERC721 Token", async() => {
        const marketplace = await setUpMarketplace();
        const normNFT = await setupContract();
        const [owner, renter] = await setupAccounts();
        const wrapper = await setupWrapper();

        const tx = await normNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tx2 = await normNFT.connect(renter).mint(renter.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const tx2Res = await tx2.wait();

        const tx3 = await normNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const tx3Res = await tx3.wait();

        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        const tokenId2 = tx2Res.events[0].args.tokenId
        console.log(tokenId2)
        let nftAddress2 = tx2Res.events[0].address.toString();

        const tokenId3 = tx3Res.events[0].args.tokenId
        console.log(tokenId3)
        let nftAddress3 = tx3Res.events[0].address.toString();

        await normNFT.connect(owner).approve(wrapper.address, tokenId);
        await normNFT.connect(renter).approve(wrapper.address, tokenId2);
        await normNFT.connect(owner).approve(wrapper.address, tokenId3);

        let wrapTx = await wrapper.connect(owner).wrapToken(nftAddress, tokenId);
        const wrapTxRes = await wrapTx.wait();

        const wtokenId = wrapTxRes.events[2].args.tokenId;
        console.log(wtokenId)
        let wnftAddress = wrapTxRes.events[2].address.toString();

        let wrapTx2 = await wrapper.connect(renter).wrapToken(nftAddress2, tokenId2);
        const wrapTxRes2 = await wrapTx2.wait();

        const wtokenId2 = wrapTxRes2.events[2].args.tokenId;
        console.log(wtokenId2)
        let wnftAddress2 = wrapTxRes2.events[2].address.toString();

        let wrapTx3 = await wrapper.connect(owner).wrapToken(nftAddress3, tokenId3);
        const wrapTxRes3 = await wrapTx3.wait();

        const wtokenId3 = wrapTxRes3.events[2].args.tokenId;
        console.log(wtokenId3)
        let wnftAddress3 = wrapTxRes3.events[2].address.toString();

        let unwrapTx = await wrapper.connect(owner).unwrapToken(wtokenId);
        const unwrapTxRes = await unwrapTx.wait();

        let currOwner = await normNFT.ownerOf(tokenId);
        expect(currOwner).to.equal(owner.address);
        console.log("NFT successfully unwrapped")

        let currOwner2 = await normNFT.ownerOf(tokenId2);
        expect(currOwner2).to.equal(wrapper.address);
        
        let currOwner3 = await normNFT.ownerOf(tokenId3);
        expect(currOwner3).to.equal(wrapper.address);

        await expect(wrapper.getOwner(wnftAddress, wtokenId)).to.be.revertedWith("ERC721: invalid token ID")
        console.log("NFT burned")
    })

    it("List ERC721 wrapped Token", async() => {
        const marketplace = await setUpMarketplace();
        const normNFT = await setupContract();
        const [owner, renter] = await setupAccounts();
        const wrapper = await setupWrapper();

        const tx = await normNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        await normNFT.approve(wrapper.address, tokenId);

        let wrapTx = await wrapper.connect(owner).wrapToken(nftAddress, tokenId);
        const wrapTxRes = await wrapTx.wait();

        const tokenId2 = wrapTxRes.events[2].args.tokenId;
        console.log(tokenId2)
        let nftAddress2 = wrapTxRes.events[2].address.toString();

        await wrapper.approve(marketplace.address, tokenId2);

        let expiryTime = Math.round(new Date().getTime() / 1000) + (1*24*60*60);
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 0, 1, expiryTime, {value: 1});
        await listNFT.wait();
        console.log(`Listed NFT ${tokenId}`);
        await expect(listNFT).to.emit(marketplace, "TokenListed").withArgs(nftAddress2, tokenId2, 10, 0, 1, expiryTime)

    })

    it("Rent wrapped ERC721 Token", async() => {
        const marketplace = await setUpMarketplace();
        const normNFT = await setupContract();
        const [owner, renter] = await setupAccounts();
        const wrapper = await setupWrapper();

        const tx = await normNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        await normNFT.approve(wrapper.address, tokenId);

        let wrapTx = await wrapper.connect(owner).wrapToken(nftAddress, tokenId);
        const wrapTxRes = await wrapTx.wait();

        const tokenId2 = wrapTxRes.events[2].args.tokenId;
        console.log(tokenId2)
        let nftAddress2 = wrapTxRes.events[2].address.toString();

        await wrapper.approve(marketplace.address, tokenId2);

        let expiryTime = Math.round(new Date().getTime() / 1000) + (1*24*60*60);
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 0, 1, expiryTime, {value: 1});
        await listNFT.wait();
        console.log(`Listed NFT ${tokenId}`);
        await expect(listNFT).to.emit(marketplace, "TokenListed").withArgs(nftAddress2, tokenId2, 10, 0, 1, expiryTime)

        const rental = await marketplace.connect(renter).rentNFT(nftAddress2, tokenId2, 1, {value: 10})
        await rental.wait();

        console.log(`Rented NFT ${tokenId}`);
        await expect(rental).to.emit(marketplace, "TokenRented").withArgs(nftAddress2, tokenId2, renter.address, 1, 10, renter.address);

        let user = await wrapper.userOf(tokenId2);
        expect(user).to.equal(renter.address);
        console.log("Rental is correct");

        await network.provider.send('evm_increaseTime', [86410])
        await network.provider.send('evm_mine')

        let newUser = await wrapper.userOf(tokenId2);
        expect(newUser).to.equal(ethers.constants.AddressZero);
        console.log("Rental has expired!");
    })

    it("Rent, Delist and Unwrap ERC721 Token", async() => {
        const marketplace = await setUpMarketplace();
        const normNFT = await setupContract();
        const [owner, renter] = await setupAccounts();
        const wrapper = await setupWrapper();

        const tx = await normNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        await normNFT.approve(wrapper.address, tokenId);

        let wrapTx = await wrapper.connect(owner).wrapToken(nftAddress, tokenId);
        const wrapTxRes = await wrapTx.wait();

        const tokenId2 = wrapTxRes.events[2].args.tokenId;
        console.log(tokenId2)
        let nftAddress2 = wrapTxRes.events[2].address.toString();

        await wrapper.approve(marketplace.address, tokenId2);

        let expiryTime = Math.round(new Date().getTime() / 1000) + (2*24*60*60);
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress2, tokenId2, 10, 0, 1, expiryTime, {value: 1});
        await listNFT.wait();
        console.log(`Listed NFT ${tokenId2}`);
        await expect(listNFT).to.emit(marketplace, "TokenListed").withArgs(nftAddress2, tokenId2, 10, 0, 1, expiryTime)

        const rental = await marketplace.connect(renter).rentNFT(nftAddress2, tokenId2, 1, {value: 10})
        await rental.wait();

        console.log(`Rented NFT ${tokenId}`);
        await expect(rental).to.emit(marketplace, "TokenRented").withArgs(nftAddress2, tokenId2, renter.address, 1, 10, renter.address);

        let user = await wrapper.userOf(tokenId2);
        expect(user).to.equal(renter.address);
        console.log("Rental is correct");

        await network.provider.send('evm_increaseTime', [86410])
        await network.provider.send('evm_mine')

        let newUser = await wrapper.userOf(tokenId2);
        expect(newUser).to.equal(ethers.constants.AddressZero);
        console.log("Rental has expired!");

        const delist = await marketplace.connect(owner).delistNFT(nftAddress2, tokenId2);
        await expect(delist).to.emit(marketplace, "TokenDelisted").withArgs(nftAddress2, tokenId2, false);
        console.log("NFT successfully delisted.")

        const claim = await marketplace.connect(owner).claimNFT(nftAddress2, tokenId2);
        await claim.wait();
        await expect(claim).to.emit(marketplace, 'TokenClaimed').withArgs(nftAddress2, tokenId2, owner.address);
        console.log(`NFT ${tokenId} claimed`);

        let tokenOwner = await wrapper.ownerOf(tokenId2);
        expect(tokenOwner).to.equal(owner.address);
        console.log("NFT transferred correctly");

        let unwrapTx = await wrapper.connect(owner).unwrapToken(tokenId2);
        const unwrapTxRes = await unwrapTx.wait();

        let currOwner = await normNFT.ownerOf(tokenId);
        expect(currOwner).to.equal(owner.address);
        console.log("NFT successfully unwrapped")

        await expect(wrapper.getOwner(nftAddress2, tokenId2)).to.be.revertedWith("ERC721: invalid token ID")
        console.log("NFT burned")
    })
})
