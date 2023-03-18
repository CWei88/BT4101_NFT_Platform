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

describe("Ether balance Test for accounts", function() {
    beforeEach(async function() {
        await network.provider.send("hardhat_reset")
    })

    it("List Ether Balance", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();

        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        await rentableNFT.approve(marketplace.address, tokenId);
        let expiryTime = Math.round(new Date().getTime() / 1000) + (2*24*60*60);

        let initialBalance = await ethers.provider.getBalance(owner.address);
        initialBalance = initialBalance.toString();
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 1, 3, expiryTime, {value: 1});
        const recp = await listNFT.wait();
        
        console.log(`Listed NFT ${tokenId}`);
        await expect(listNFT).to.emit(marketplace, "TokenListed").withArgs(nftAddress, tokenId, 10, 1, 3, expiryTime)

        const gasUsed = BigInt(recp.cumulativeGasUsed) * BigInt(recp.effectiveGasPrice);

        let newBalance = await ethers.provider.getBalance(owner.address);
        newBalance = newBalance.toString()
        expect(BigInt(initialBalance)).to.equal(BigInt(newBalance) + BigInt(gasUsed) + 1n);
    })

    it("Bid Ether Balance", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();      
        const accounts = await ethers.getSigners();
        let acc = accounts[3]
        let mplaceOwner = accounts[2];

        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        await rentableNFT.approve(marketplace.address, tokenId);
        let expiryTime = Math.round(new Date().getTime() / 1000) + (2*24*60*60);

        let initialBalance = await ethers.provider.getBalance(owner.address);
        initialBalance = initialBalance.toString();
        console.log(initialBalance)

        let mOwnerInitialBalance = await ethers.provider.getBalance(mplaceOwner.address);
        mOwnerInitialBalance = mOwnerInitialBalance.toString();
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 10, 1, 3, expiryTime, {value: 1});
        const recp = await listNFT.wait();

        let bidderBalance = await ethers.provider.getBalance(renter.address);
        bidderBalance = bidderBalance.toString();

        const bidNFT = await marketplace.connect(renter).bidNFT(nftAddress, tokenId, 2, {value: 25});
        const bidRecp = await bidNFT.wait()
        expect(bidNFT).to.emit(marketplace, "TokenBid").withArgs(nftAddress, tokenId, 2, 25);

        let accinitBalance = await ethers.provider.getBalance(acc.address);
        accinitBalance = accinitBalance.toString();

        const bidNFT2 = await marketplace.connect(acc).bidNFT(nftAddress, tokenId, 2, {value: 20});
        const bidRecp2 = await bidNFT2.wait()
        expect(bidNFT2).to.emit(marketplace, "TokenBid").withArgs(nftAddress, tokenId, 2, 20);

        const accept = await marketplace.connect(owner).acceptBid(nftAddress, tokenId, renter.address);
        const acptRecp = await accept.wait();
        expect(accept).to.emit(marketplace, "TokenRented").withArgs(nftAddress, tokenId, renter.address, 2, 10, renter.address);

        const withdrawComms = await marketplace.connect(mplaceOwner).withdrawComission();
        const withdrawRecp = await withdrawComms.wait();

        const mOwnergasUsed = BigInt(withdrawRecp.cumulativeGasUsed) * BigInt(withdrawRecp.effectiveGasPrice);

        let finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        finalOwnerBalance = finalOwnerBalance.toString()
        let finalBidderBalance = await ethers.provider.getBalance(renter.address);
        finalBidderBalance = finalBidderBalance.toString();
        let accFinalBalance = await ethers.provider.getBalance(acc.address);
        accFinalBalance = accFinalBalance.toString()
        let finalmOwnerBalance = await ethers.provider.getBalance(mplaceOwner.address);
        finalmOwnerBalance = finalmOwnerBalance.toString();

        const OwnergasUsed = BigInt(recp.cumulativeGasUsed) * BigInt(recp.effectiveGasPrice);
        const bidgasused = BigInt(bidRecp.cumulativeGasUsed) * BigInt(bidRecp.effectiveGasPrice);
        const accbidgas = BigInt(bidRecp2.cumulativeGasUsed) * BigInt(bidRecp2.effectiveGasPrice);
        const acptGasUsed = BigInt(acptRecp.cumulativeGasUsed) * BigInt(acptRecp.effectiveGasPrice);

        expect(BigInt(finalOwnerBalance)).to.equal(BigInt(initialBalance) - BigInt(OwnergasUsed) - BigInt(acptGasUsed) + 22n);
        expect(BigInt(finalBidderBalance)).to.equal(BigInt(bidderBalance) - BigInt(bidgasused) - 25n);
        expect(BigInt(accFinalBalance)).to.equal(BigInt(accinitBalance) - BigInt(accbidgas));
        expect(BigInt(finalmOwnerBalance)).to.equal(BigInt(mOwnerInitialBalance) - BigInt(mOwnergasUsed) + 3n);
    })

    it("Rent Ether Balance", async() => {
        const marketplace = await setUpMarketplace();
        const rentableNFT = await setupContract();
        const [owner, renter] = await setupAccounts();  
        const accounts = await ethers.getSigners();
        let mplaceOwner = accounts[2];    

        const tx = await rentableNFT.connect(owner).mint(owner.address, 'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU');
        const txRes = await tx.wait();

        const tokenId = txRes.events[0].args.tokenId
        console.log(tokenId)
        let nftAddress = txRes.events[0].address.toString();

        await rentableNFT.approve(marketplace.address, tokenId);
        let expiryTime = Math.round(new Date().getTime() / 1000) + (2*24*60*60);

        let initialBalance = await ethers.provider.getBalance(owner.address);
        initialBalance = initialBalance.toString();
        
        let mOwnerInitialBalance = await ethers.provider.getBalance(mplaceOwner.address);
        mOwnerInitialBalance = mOwnerInitialBalance.toString();
        
        const listNFT = await marketplace.connect(owner).listNFT(nftAddress, tokenId, 1000, 1, 3, expiryTime, {value: 1});
        const recp = await listNFT.wait();

        let renterInitialBalance = await ethers.provider.getBalance(renter.address);
        renterInitialBalance = renterInitialBalance.toString();

        const rental = await marketplace.connect(renter).rentNFT(nftAddress, tokenId, 1, {value: 1000})
        const rentRecp = await rental.wait();

        console.log(`Rented NFT ${tokenId}`);
        await expect(rental).to.emit(marketplace, "TokenRented").withArgs(nftAddress, tokenId, renter.address, 1, 1000, renter.address);

        const OwnergasUsed = BigInt(recp.cumulativeGasUsed) * BigInt(recp.effectiveGasPrice);
        const rentGasUsed = BigInt(rentRecp.cumulativeGasUsed) * BigInt(rentRecp.effectiveGasPrice);

        const withdrawComms = await marketplace.connect(mplaceOwner).withdrawComission();
        const withdrawRecp = await withdrawComms.wait();

        const mOwnergasUsed = BigInt(withdrawRecp.cumulativeGasUsed) * BigInt(withdrawRecp.effectiveGasPrice);

        let finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        finalOwnerBalance = finalOwnerBalance.toString()
        let finalRenterBalance = await ethers.provider.getBalance(renter.address);
        finalRenterBalance = finalRenterBalance.toString();
        let finalmOwnerBalance = await ethers.provider.getBalance(mplaceOwner.address);
        finalmOwnerBalance = finalmOwnerBalance.toString();

        expect(BigInt(finalOwnerBalance)).to.equal(BigInt(initialBalance) - BigInt(OwnergasUsed) + 899n);
        expect(BigInt(finalRenterBalance)).to.equal(BigInt(renterInitialBalance) - BigInt(rentGasUsed) - 1000n);
        expect(BigInt(finalmOwnerBalance)).to.equal(BigInt(mOwnerInitialBalance) - BigInt(mOwnergasUsed) + 101n);

        })
})