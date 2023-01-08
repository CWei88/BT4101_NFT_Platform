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

it("Rent flow ERC4907", async () => {
    const NFTRM = await setupMarketplace();
    const rentableNFT = await setupContract();
    const [owner, renter] = await setupAccounts();

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();

    //Set Approval for Marketplace
    //TODO
    //Fix Approval
    await rentableNFT.approveUser(NFTRM.address);

    //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
    const tx = await rentableNFT.connect(owner).mint(1, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    const txRes = await tx.wait();

    //Mint second token
    //const tx2 = await rentableNFT.connect(owner).mint(2, 'test')
    //const tx2Res = await tx2.wait();

    //Get tokenId
    const tokenId = txRes.events[0].args.tokenId
    console.log(tokenId)

    //Get NFT Address
    let nftAddress = txRes.events[0].address.toString();

    //check owner of tokenId 0
    const ownerOf = await rentableNFT.ownerOf(tokenId);
    expect(ownerOf).to.equal(owner.address);
    console.log("Owner is correct!")

    //list Token onto marketplace
    const lis = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 600, {value: listingFee})
    await lis.wait()
    //const lis2 = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 6000, {value: listingFee})
    //await lis2.wait()
    console.log("Listed Test NFT");

    //Rent NFT to renter for 10 minutes
    await NFTRM.rentNFT(tokenId, renter.address, {value: 1})
    console.log("Rented Test NFT")

    //Check all NFT listed
    await NFTRM.getAllNFTs();
    console.log("Got Listed NFTs")

    //Check Renter userId
    const renterOf = await NFTRM.connect(renter).getMyNFTs();
    const rOf = renterOf[0][4]
    expect(rOf).to.equal(renter.address);
    console.log("Renter is correct!")

    //Move chain forward in time to check if nft is still being rented out.
    await network.provider.send('evm_increaseTime', [610])
    await network.provider.send('evm_mine')

    //check renter of token
    const renterOf2 = await NFTRM.connect(renter).getMyNFTs();
    expect(renterOf2.length).to.equal(0)
    console.log("All Tests Correct!")

})

it("List Flow ERC721", async () => {
    const NFTRM = await setupMarketplace();
    const nonRNFT = await setUpERC721();
    const [owner] = await setupAccounts();

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();

    nonRNFT.approveUser(NFTRM.address)

    const tx = await nonRNFT.connect(owner).mint('newURI');
    const txRes = await tx.wait();

    //Get tokenId
    const tokenId = txRes.events[0].args.tokenId
    console.log(tokenId)

    //Get NFT Address
    let nftAddress = txRes.events[0].address.toString();

    //check owner of tokenId 0
    const ownerOf = await nonRNFT.ownerOf(tokenId);
    expect(ownerOf).to.equal(owner.address);
    console.log("Owner is correct!")

    //list Token onto marketplace
    const lis = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 700, {value: listingFee})
    await lis.wait()
    //const lis2 = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 6000, {value: listingFee})
    //await lis2.wait()
    console.log("Listed Test NFT");

    const res = await NFTRM.getMyNFTs();
    console.log(owner.address)
    expect(res.length).to.equal(1);
    expect(res[0][3]).to.equal(owner.address)
})

it("Prevent renter from listing and delisting", async() => {
    const NFTRM = await setupMarketplace();
    const rentableNFT = await setupContract();
    const [owner, renter] = await setupAccounts();

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();

    //Set Approval for Marketplace
    //TODO
    //Fix Approval
    await rentableNFT.approveUser(NFTRM.address);

    //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
    const tx = await rentableNFT.connect(owner).mint(1, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    const txRes = await tx.wait();

    //Mint second token
    //const tx2 = await rentableNFT.connect(owner).mint(2, 'test')
    //const tx2Res = await tx2.wait();

    //Get tokenId
    const tokenId = txRes.events[0].args.tokenId
    console.log(tokenId)

    //Get NFT Address
    let nftAddress = txRes.events[0].address.toString();

    //check owner of tokenId 0
    const ownerOf = await rentableNFT.ownerOf(tokenId);
    expect(ownerOf).to.equal(owner.address);
    console.log("Owner is correct!")

    //list Token onto marketplace
    const lis = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 6000, {value: listingFee})
    await lis.wait()
    //const lis2 = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 6000, {value: listingFee})
    //await lis2.wait()
    console.log("Listed Test NFT");

    //Rent NFT to renter for 10 minutes
    await NFTRM.rentNFT(tokenId, renter.address, {value: 1})
    console.log("Rented Test NFT")
    
    await expect(NFTRM.connect(renter).listNFT(nftAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 6000, {value: listingFee}))
    .to.be.revertedWith("ERC721: Caller is not owner or approved")
    console.log("Tested Listing")

    await expect(NFTRM.connect(renter).delistNFT(nftAddress, tokenId)).to.be.revertedWith("Only NFT owner can delist")
    console.log("Tested delisting")
})

it("Checks unrented NFT after expiry", async() => {
    const NFTRM = await setupMarketplace();
    const rentableNFT = await setupContract();
    const [owner] = await setupAccounts();

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();

    //Set Approval for Marketplace
    //TODO
    //Fix Approval
    await rentableNFT.approveUser(NFTRM.address);

    //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
    const tx = await rentableNFT.connect(owner).mint(1, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    const txRes = await tx.wait();

    //Mint second token
    //const tx2 = await rentableNFT.connect(owner).mint(2, 'test')
    //const tx2Res = await tx2.wait();

    //Get tokenId
    const tokenId = txRes.events[0].args.tokenId
    console.log(tokenId)

    //Get NFT Address
    let nftAddress = txRes.events[0].address.toString();

    //check owner of tokenId 0
    const ownerOf = await rentableNFT.ownerOf(tokenId);
    expect(ownerOf).to.equal(owner.address);
    console.log("Owner is correct!")

    //list Token onto marketplace
    const lis = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 700, {value: listingFee})
    await lis.wait()
    //const lis2 = await NFTRM.connect(owner).listNFT(nftAddress, tokenId, 1, Math.round(new Date().getTime() / 1000) + 6000, {value: listingFee})
    //await lis2.wait()
    console.log("Listed Test NFT");

    //Move chain forward in time to check if nft is still being rented out.
    await network.provider.send('evm_increaseTime', [101])
    await network.provider.send('evm_mine')

    await NFTRM.refreshNFTs();

    const getMyNFT = await NFTRM.connect(owner).getMyNFTs();
    expect(getMyNFT.length).to.equal(1);
    console.log("Check owner NFTs")

    const getAllNFT = await NFTRM.getAllNFTs();
    expect(getAllNFT.length).to.equal(1);
    console.log("No NFT returned")

     //TODO
    //Fix This
    const getListedNFT = await NFTRM.getListedNFTs();
    console.log(getListedNFT)
    expect(getListedNFT.length).to.equal(0);
    console.log("Got listed NFTs")
})

it("Multiple NFT listings", async() => {
    const NFTRM = await setupMarketplace();
    const rentableNFT = await setupContract();
    const [owner, renter] = await setupAccounts();
    const ERC721Token = await setUpERC721();

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();

    //Set Approval for Marketplace
    await rentableNFT.approveUser(NFTRM.address);
    await ERC721Token.approveUser(NFTRM.address);

    //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
    const tx = await rentableNFT.connect(owner).mint(3, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    const txRes = await tx.wait();

    //Mint second token
    const tx2 = await ERC721Token.connect(owner).mint('test')
    const tx2Res = await tx2.wait();

    //Mint third token
    const tx3 = await ERC721Token.connect(owner).mint('test2')
    const tx3Res = await tx3.wait();

    //Get tokenId of tokens
    const tokenId1 = txRes.events[0].args.tokenId
    const tokenId2 = tx2Res.events[0].args.tokenId;
    const tokenId3 = tx3Res.events[0].args.tokenId;

    //Get NFT Address of tokens
    let nftAddress1 = txRes.events[0].address.toString();
    let nftAddress2 = tx2Res.events[0].address.toString()
    let nftAddress3 = tx3Res.events[0].address.toString()

    //Wrap tokens
    //deploy first wrapper
    const wrapper1 = await ethers.getContractFactory('ERC4907Wrapper')
    const deWrap1 = await wrapper1.deploy(nftAddress2, 'Diff1', 'DF')
    await deWrap1.deployed();

    await ERC721Token.approveUser(deWrap1.address);

    //TODO
    //Fix this
    const tx4 = await deWrap1.connect(owner).wrapToken(tokenId2);
    const tx4Res = await tx4.wait();

    //deploy second wrapper
    const wrapper2 = await ethers.getContractFactory('ERC4907Wrapper')
    const deWrap2 = await wrapper2.deploy(nftAddress3, 'Diff2', 'DF')
    await deWrap2.deployed();

    await ERC721Token.approveUser(deWrap2.address)

    const tx5 = await deWrap2.connect(owner).wrapToken(tokenId3);
    const tx5Res = await tx5.wait();

    //update tokenaddress
    nftAddress2 = tx4Res.events[2].address.toString()
    nftAddress3 = tx5Res.events[2].address.toString()

    await deWrap1.approve(NFTRM.address, tokenId2)
    await deWrap2.approve(NFTRM.address, tokenId3)

    console.log(deWrap1.address)

    //Check if token has been transferred to wrapper correctly
    expect(await ERC721Token.ownerOf(tokenId2)).to.equal(deWrap1.address)
    expect(await ERC721Token.ownerOf(tokenId3)).to.equal(deWrap2.address)

    //check owner of tokenId 0
    const ownerOf = await rentableNFT.ownerOf(tokenId1);
    expect(ownerOf).to.equal(owner.address);
    console.log("Owner is correct!")

    //list Token onto marketplace
    const lis = await NFTRM.connect(owner).listNFT(nftAddress1, tokenId1, 1, Math.round(new Date().getTime() / 1000) + 800, {value: listingFee})
    await lis.wait()
    console.log('First NFT listed')

    const lis2 = await NFTRM.connect(owner).listNFT(nftAddress2, tokenId2, 3, Math.round(new Date().getTime() / 1000) + 900, {value: listingFee})
    await lis2.wait()

    const lis3 = await NFTRM.connect(owner).listNFT(nftAddress3, tokenId3, 3, Math.round(new Date().getTime() / 1000) + 1000, {value: listingFee})
    await lis3.wait()
    console.log("Listed Test NFT");

    //Rent NFT to renter for 10 minutes
    await NFTRM.rentNFT(tokenId3, renter.address, {value: 3})
    console.log("Rented Test NFT")

    //Check all NFT 
    const test = await NFTRM.getAllNFTs();
    expect(test.length).to.equal(3);
    console.log("Got Listed NFTs")

    //Check all listed NFT
    let listedNFT = await NFTRM.getListedNFTs();
    expect(listedNFT.length).to.equal(2);

    //Check NFT delisting
    const delis = await NFTRM.connect(owner).delistNFT(nftAddress1, tokenId1);
    await delis.wait();
    let newlis = await NFTRM.getAllNFTs();
    expect(newlis.length).to.equal(2);
    console.log("NFT successfully delisted")

    //Check Renter userId
    const renterOf = await NFTRM.connect(renter).getMyNFTs();
    const rOf = renterOf[0][4]
    expect(rOf).to.equal(renter.address);
    console.log("Renter is correct!")

    //Check NFT rented out
    let rentedNFT = await NFTRM.connect(owner).getMyRentedNFTs()
    expect(rentedNFT.length).to.equal(1)
    console.log("Amount of NFT Rented Correct")

    //Move chain forward in time to check if nft is still being rented out.
    await network.provider.send('evm_increaseTime', [1010])
    await network.provider.send('evm_mine')

    await NFTRM.refreshNFTs();

    //check renter of token
    const renterOf2 = await NFTRM.connect(renter).getMyNFTs();
    expect(renterOf2.length).to.equal(0)
    console.log("All Tests Correct!")

     //Check NFT rented out
    let lasNFT = await NFTRM.connect(owner).getMyRentedNFTs()
    expect(lasNFT.length).to.equal(0)
    console.log("Amount of NFT Rented after expiry Correct")

    //Check NFT Listed
    let newT = await NFTRM.getListedNFTs();
    console.log(newT)
    expect(newT.length).to.equal(0);
    console.log("Final Test correct!")

    console.log(await ERC721Token.ownerOf(tokenId2))
    console.log(owner.address)


    //TODO
    //Fix unWrap. Should not be able to unWrap as token is still listed.
    //Token should be delisted before unwrapping.
    //Unwrap tokens
    //deploy first wrapper
    await expect(deWrap1.connect(owner).unwrapToken(tokenId2)).to.be.revertedWith("Only owner can unwrap")
    console.log("error correct")

    const delis2 = await NFTRM.connect(owner).delistNFT(nftAddress2, tokenId2)
    await delis2.wait();
    const tx6 = await deWrap1.connect(owner).unwrapToken(tokenId2);
    const tx6Res = await tx6.wait();
    console.log("First token unwrapped")
    
    //deploy second wrapper
    const delis3 = await NFTRM.connect(owner).delistNFT(nftAddress3, tokenId3)
    await delis3.wait();
    const tx7 = await deWrap2.connect(owner).unwrapToken(tokenId3);
    const tx7Res = await tx7.wait();
    console.log("Second token unwrapped")

    //Check if token has been transferred back to owner.
    expect(await ERC721Token.ownerOf(tx6Res.events[2].args.tokenId)).to.equal(owner.address)
    expect(await ERC721Token.ownerOf(tx7Res.events[2].args.tokenId)).to.equal(owner.address)
})
