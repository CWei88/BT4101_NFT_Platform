const { ethers, network } = require('hardhat');
const { expect } = require('chai');

const setUpERCCollection = async () => {
     const getCollection = await ethers.getContractFactory("ERC721CollectionV2")
     const collectionNFT = await (getCollection).deploy();
     await collectionNFT.deployed();
     return collectionNFT;
}

const setupMarketplace = async () => {
    const RentableNFT = await ethers.getContractFactory("NFTRM")
    const rNFT = await RentableNFT.deploy();
    await rNFT.deployed();
    return rNFT;
}

const setupAccounts = async () => {
    const accounts = await ethers.getSigners();
    return [accounts[0], accounts[1]];
}
console.log("test")

const RARITIES = [
    { name: 'common', index: 0, value: 100000 },
    { name: 'uncommon', index: 1, value: 10000 },
    { name: 'rare', index: 2, value: 5000 },
    { name: 'epic', index: 3, value: 1000 },
    { name: 'legendary', index: 4, value: 100 },
    { name: 'mythic', index: 5, value: 10 },
    { name: 'unique', index: 6, value: 1 }];


const DEFAULT_RARITY_PRICE = '100000000000000000000'

it("Listing Collection", async() => {
    const NFTRM = await setupMarketplace();
    const collection = await setUpERCCollection();
    const [owner, renter] = await setupAccounts();
    console.log("Accounts set up")

    const rarities = await ethers.getContractFactory("Rarities")
    const raritiesDeploy = await rarities.deploy(owner.address, RARITIES.map((rarity) => [
        rarity.name,
        rarity.value,
        DEFAULT_RARITY_PRICE
    ]));
    console.log('rarity set up')

    await raritiesDeploy.deployed();
    console.log(raritiesDeploy)

    let listingFee = await NFTRM.getListingFee();
    listingFee = listingFee.toString();

    console.log(listingFee)

    let collectionItems = [{rarity: 'rare', price: 1, address: owner, metadata:'QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU'}, 
                            {rarity: 'rare', price: 2, address: owner, metadata: 'abcd'}]

    await collection.initialize("test", "T", "ABCD", owner.address, false, true, raritiesDeploy['rare'], collectionItems)

    expect(collection.connect(owner).isCreator()).to.equal(true)

    const mintTx = await collection.issueToken(owner, 1)
    const txRes = mintTx.wait();

    const tokenId = txRes.events[0].args.tokenId
    console.log(tokenId)




})

it("Renting Collection", async() => {

})

it("Verifying Collection Owner", async() => {

})

