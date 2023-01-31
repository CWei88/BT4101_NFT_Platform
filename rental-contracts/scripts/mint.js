require('dotenv').config()
const {ethers} = require('hardhat')

const PUBLIC_KEY = process.env.PUBLIC_KEY

const TOKEN_URI = `https://gateway.pinata.cloud/ipfs/QmPZQxFzkvSiSyVjz1gXb1detb4Vaou4bK39YiiBApevUz`

const contract = require('../artifacts/contracts/RentableNFT.sol/RentableNFT.json')
const contractAddress = '0xe6c9419D4f78b2CDd2f4Bbe2AAEd083B218BB335'

async function mint() {
    const NFT = await ethers.getContractAt(contract.abi, contractAddress)
    const tx = await NFT.mint(PUBLIC_KEY, TOKEN_URI)
    const recp = await tx.wait()
    console.log("The hash of the transaction is:", recp.transactionHash)
}

mint().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})