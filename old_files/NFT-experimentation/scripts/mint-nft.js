require('dotenv').config();
const API_URL = process.env.API_URL
const PUBLIC_KEY = process.env.PUBLIC_KEY
const PRIVATE_KEY = process.env.PRIVATE_KEY

const { createAlchemyWeb3 } = require('@alch/alchemy-web3')
const web3 = createAlchemyWeb3(API_URL)

const contract = require('../artifacts/contracts/Token.sol/Token.json')
const contractAddress =  "0xdc3a74e97f3d40ebd0ec64b9b01128b6e200969c"
const nftContract = new web3.eth.Contract(contract.abi, contractAddress)

async function mintNFT(tokenURI) { 
    const nonce = await web3.eth.getTransactionCount(PUBLIC_KEY, 'latest')

    const tx = {
        'from': PUBLIC_KEY,
        'to': contractAddress,
        'nonce': nonce,
        'gas': 100000,
        'data': nftContract.methods.mintNFT(PUBLIC_KEY, tokenURI).encodeABI()
    };

    const signPromise = web3.eth.accounts.signTransaction(tx, PRIVATE_KEY)
    signPromise.then((signedTx) => {
        web3.eth.sendSignedTransaction(signedTx.rawTransaction, 
            function(err, hash) {
                if (err) { 
                    console.log("Something went wrong signing the transaction.")
                } else {
                    console.log("The hash of your transaction is: ", hash)
                }
            })
    })
    .catch((err) => {
        console.log("Promise failed: ", err)
    })
}

mintNFT("ipfs://QmR9Yn6ce8zo6J28qRhB7VRVctp5RtZgP5VjLBB92GGc51")

