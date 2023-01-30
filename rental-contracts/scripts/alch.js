const {Alchemy, Network} = require('alchemy-sdk')
require('dotenv').config();

const config = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_GOERLI
}

const alchemy = new Alchemy(config);

async function main() {
    const address = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707"

    const tokenId = 1;

    const owner = await alchemy.nft.getOwnersForNft(address, tokenId)
    console.log(owner)
}

main().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})