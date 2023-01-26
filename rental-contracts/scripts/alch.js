const {Alchemy, Network, Wallet, Utils} = require('alchemy-sdk')
require('dotenv').config();

const { API_KEY, PRIVATE_KEY } = process.env;

const settings = {
    apiKey: API_KEY,
    network: Network.ETH_GOERLI
}

const alchemy = new Alchemy(settings)

let wallet = new Wallet(PRIVATE_KEY)

async function main() {
    const nonce = await alchemy.core.getTransactionCount(
        wallet.address, "latest"
    );

    let transaction = {
        
    }
}

