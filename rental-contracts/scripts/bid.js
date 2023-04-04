require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0xa29d10dAD47784a00Aa14372d63b39466fE30e8A'

const rentableContract = require('../artifacts/contracts/RentableNFT.sol/RentableNFT.json')

async function bid() {
    const Market = await ethers.getContractAt("MarketplaceDC", contractAddress)

    const renter = '0xD172885233efaa6Ce7018c0718D12550a2991196'
    const NFTAddress = '0x5eA85Ff0d0C68f6F9A15E8F53196d514ac5B2186'
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    const renterSigner = await ethers.getSigner(renter)

    console.log("Bidding for NFT")
    let bidTx = await Market.connect(renterSigner).bidNFT(NFTAddress, '1', 2, {value: 200});
    await bidTx.wait();

    console.log("Bid successfully submitted.");

    console.log("Rejecting bid")
    let rejectBidTx = await Market.connect(owner).rejectBid(NFTAddress, '1', renter);
    await rejectBidTx.wait()
    console.log("Bid successfully rejected");

    console.log("Bidding for NFT")
    let bidTx2 = await Market.connect(renterSigner).bidNFT(NFTAddress, '1', 2, {value: 200});
    await bidTx2.wait();

    console.log("Withdrawing bid");
    let withdrawBidTx = await Market.connect(renterSigner).withdrawBid(NFTAddress, '1');
    await withdrawBidTx.wait();
    console.log("Bid successfully withdrawn")

    console.log("Bidding for NFT")
    let bidTx3 = await Market.connect(renterSigner).bidNFT(NFTAddress, '1', 2, {value: 200});
    await bidTx3.wait();

    console.log("Accepting Bid")
    let acceptTx = await Market.connect(owner).acceptBid(NFTAddress, '1', renter);
    await acceptTx.wait();
    console.log("Bid accepted");
}

bid().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})