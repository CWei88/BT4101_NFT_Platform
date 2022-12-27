const { ethers, network } = require('hardhat');
const { expect } = require('chai');
const { web3 } = require('web3')

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

it("Rent flow", async () => {
    const NFTRM = await setupMarketplace();
    const rentableNFT = await setupContract();
    const [owner, renter] = await setupAccounts();

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();

    //Set Approval for Marketplace
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
    const rent = await NFTRM.rentNFT(tokenId, renter.address, {value: 1})
    console.log("Rented Test NFT")

    //Check all NFT listed
    const test = await NFTRM.getAllNFTs();
    console.log("Got Listed NFTs")

    //Check Renter userId
    const renterOf = await NFTRM.connect(renter).getMyNFTs();
    const rOf = renterOf[0][4]
    expect(rOf).to.equal(renter.address);
    console.log("Renter is correct!")

    //Move chain forward in time to check if nft is still being rented out.
    await network.provider.send("evm_increaseTime", [601]);
    await network.provider.send("evm_mine")

    //check renter of token
    const renterOf2 = await NFTRM.connect(renter).getMyNFTs();
    console.log(renterOf2)
    expect(renterOf2.length).to.equal(0)
    expect(renterOf2).to.not.equal(renter.address)
    expect(renterOf2).to.equal("0x0000000000000000000000000000000000000000")
    console.log("All Tests Correct!")
})