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

describe("Ether balance Test for accounts", function() {
    beforeEach(async function() {
        await network.provider.send("hardhat_reset")
    })

    it("List Ether Balance", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();

        let initialBalance = await ethers.provider.getBalance(owner.address);
        initialBalance = initialBalance.toString();
        console.log(initialBalance)

        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();
    
        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        await rentableNFT.approve(marketplace.address, tokenId);
        let expiryTime = Math.round(new Date().getTime() / 1000) + (2*24*60*60);
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 1, 3, expiryTime, {value: 1});
        const recp = await listNFT.wait();
        console.log(`Listed NFT ${tokenId}`);
        await expect(listNFT).to.emit(marketplace, "TokenListed").withArgs(nftAddress, tokenId, 10, 1, 3, expiryTime)


        let newBalance = await ethers.provider.getBalance(owner.address);
        newBalance = newBalance.toString()
        console.log(newBalance)
        expect(BigInt(initialBalance)).to.equal(BigInt(newBalance) + 1n);
    })

    it("Bid Ether Balance")

    it("Rent Ether Balance")
})