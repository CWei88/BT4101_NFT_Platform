require('dotenv').config()
const {ethers} = require('hardhat')

const PUBLIC_KEY = process.env.REACT_APP_PUBLIC_KEY

const TOKEN_URI = `https://gateway.pinata.cloud/ipfs/QmPZQxFzkvSiSyVjz1gXb1detb4Vaou4bK39YiiBApevUz`

const contract = require('../artifacts/contracts/RentableNFT.sol/RentableNFT.json')
const contractAddress = '0x5eA85Ff0d0C68f6F9A15E8F53196d514ac5B2186'

async function mint() {
    const NFT = await ethers.getContractAt(contract.abi, contractAddress)
    const tx = await NFT.mint(PUBLIC_KEY, TOKEN_URI)
    const recp = await tx.wait()
    console.log("The hash of the transaction is:", recp.transactionHash)
    console.log("The tokenId is", recp.events[0].args.tokenId);
    console.log("The contract address is", recp.events[0].address.toString())
}

mint().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})