const { ethers, network } = require('hardhat');
const { expect } = require('chai');

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
    const rentableNFT = await setupContract();
    const [owner, renter] = await setupAccounts();

    //Mint tokenID to owner. Connect function lets us interact with contract instance explicitly from an account of our choice.
    const tx = await rentableNFT.connect(owner).mint(0, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
    await tx.wait();

    //check owner of tokenId 0
    const ownerOf = await rentableNFT.ownerOf(0);
    expect(ownerOf).to.equal(owner.address);

    //Rent NFT to renter for 10 minutes
    const expiryTime = Math.round(new Date().getTime() / 1000) + 600
    const rentTx = await rentableNFT.connect(owner).rent(0, renter.address, expiryTime);

    //Check Renter userId
    const renterOf = await rentableNFT.userOf(0);
    expect(renterOf).to.equal(renter.address);

    //Move chain forward in time to check if nft is still being rented out.
    await network.provider.send("evm_increaseTime", [601]);
    await network.provider.send("evm_mine")

    //check renter of token
    const renterOf2 = await rentableNFT.userOf(0)
    expect(renterOf2).to.not.equal(renter.address)
    expect(renterOf2).to.equal("0x0000000000000000000000000000000000000000")
})