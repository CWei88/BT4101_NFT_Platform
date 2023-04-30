require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0x51eEB2E8836030dC5d34B7e6c37c3Ab44D202d39'

const wrapperContract = require('../../artifacts/contracts/ERC4907/ERC4907.sol/ERC4907.json')

async function bid() {
    const Market = await ethers.getContractAt("MarketplaceDC", contractAddress)

    const renter = '0xD172885233efaa6Ce7018c0718D12550a2991196'
    const NFTAddress = '0x3dE1410ceE2053B2958731a548FF51B71ec4F131'
    const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'

    const renterSigner = await ethers.getSigner(renter)
    const ownerSigner = await ethers.getSigner(owner)

    console.log("Bidding for NFT")
    let bidTx = await Market.connect(renterSigner).bidNFT(NFTAddress, '2', 2, {value: 200});
    await bidTx.wait();

    console.log("Bid successfully submitted.");

    console.log("Rejecting bid")
    let rejectBidTx = await Market.connect(ownerSigner).rejectBid(NFTAddress, '2', renter);
    await rejectBidTx.wait()
    console.log("Bid successfully rejected");

    console.log("Bidding for NFT")
    let bidTx2 = await Market.connect(renterSigner).bidNFT(NFTAddress, '2', 2, {value: 200});
    await bidTx2.wait();

    console.log("Withdrawing bid");
    let withdrawBidTx = await Market.connect(renterSigner).withdrawBid(NFTAddress, '2');
    await withdrawBidTx.wait();
    console.log("Bid successfully withdrawn")

    console.log("Bidding for NFT")
    let bidTx3 = await Market.connect(renterSigner).bidNFT(NFTAddress, '2', 2, {value: 200});
    await bidTx3.wait();

    console.log("Accepting Bid")
    let acceptTx = await Market.connect(ownerSigner).acceptBid(NFTAddress, '2', renter);
    await acceptTx.wait();
    console.log("Bid accepted");
}

bid().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(0)
})