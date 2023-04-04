require('dotenv').config()
const {ethers} = require('hardhat')

const PUBLIC_KEY = process.env.PUBLIC_KEY

const TOKEN_URI = `https://gateway.pinata.cloud/ipfs/QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU`

const contract = require('../artifacts/contracts/DiffTypeNFT.sol/DiffTypeNFT.json')
const contractAddress = '0xaD09F27B6646f90AB4827A7dC22C5F975869050c'

async function mint() {
    const nft = await ethers.getContractAt(contract.abi, contractAddress)
    const tx = await nft.mint(PUBLIC_KEY, TOKEN_URI);
    const recp = await tx.wait()
    console.log("The transaction hash is: ", recp.transactionHash);
}

mint().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})

