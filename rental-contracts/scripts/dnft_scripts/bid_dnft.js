require('dotenv').config()
const {ethers} = require('hardhat')

const marketplaceContract = require('../../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json')
const contractAddress = '0xa29d10dAD47784a00Aa14372d63b39466fE30e8A'

const wrapperContract = require('../../artifacts/contracts/ERC4907/ERC4907.sol/ERC4907.json')

async function bid() {
    const Market = await ethers.getContractAt("MarketplaceDC", contractAddress)

    const renter = '0xD172885233efaa6Ce7018c0718D12550a2991196'
    const NFTAddress = '0xfD3E5809B411AE36f791D05F6BaD61AA018C0214'
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