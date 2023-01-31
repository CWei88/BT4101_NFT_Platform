const {Alchemy, Network} = require('alchemy-sdk')
require('dotenv').config();

const config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_GOERLI
}

const alchemy = new Alchemy(config);

async function main() {
  // Get all NFTs
  const nfts = await alchemy.nft.getOwnersForNft('0x0E99b6eEAF4777b8D3b9A6dEd29a363df43adED3', '1')
  // Print NFTs
  console.log(nfts);
}

main().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})

/*isHolder().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})*/