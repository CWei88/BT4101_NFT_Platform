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

    //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
    const tx = await rentableNFT.connect(owner).mint(1, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    const txRes = await tx.wait();
    console.log(txRes.events[0].address)

    //Get tokenId
    const tokenId = txRes.events[0].args.tokenId
    console.log(tokenId)

    //check owner of tokenId 0
    const ownerOf = await rentableNFT.ownerOf(tokenId);
    expect(ownerOf).to.equal(owner.address);
    console.log("Owner is correct!")

    //list Token onto marketplace
    console.log("stop here")
    const lis = await NFTRM.connect(owner).listNFT(txRes.events[0].address, tokenId, 1, Math.round(new Date().getTime() / 1000) + 600, {value: listingFee})
    await lis.wait()

    //Rent NFT to renter for 10 minutes
    console.log('or here')
    const rent = await NFTRM.connect(owner).rentNFT(tx.address, tokenId, renter, {value: 1});
    await rent.wait()

    //Check something
    console.log(owner.address);
    const a = await NFTRM.getNFTOwner(tokenId);
    console.log(a)
    const test = await NFTRM.connect(owner).getMyNFTs();
    console.log(test);

    //Check Renter userId
    const renterOf = await NFTRM.connect(renter).getMyNFTs()[0];
    expect(renterOf).to.equal(renter.address);
    console.log("Renter is correct!")

    //Move chain forward in time to check if nft is still being rented out.
    await network.provider.send("evm_increaseTime", [601]);
    await network.provider.send("evm_mine")

    //check renter of token
    const renterOf2 = await rentableNFT.userOf(0)
    expect(renterOf2).to.not.equal(renter.address)
    expect(renterOf2).to.equal("0x0000000000000000000000000000000000000000")
})