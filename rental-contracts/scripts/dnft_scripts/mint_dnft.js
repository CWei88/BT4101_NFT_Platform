require('dotenv').config()
const {ethers} = require('hardhat')

const PUBLIC_KEY = process.env.REACT_APP_PUBLIC_KEY

const TOKEN_URI = `https://gateway.pinata.cloud/ipfs/QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU`

const contract = require('../artifacts/contracts/DiffTypeNFT.sol/DiffTypeNFT.json')
const contractAddress = '0xAFBa120f281FF1dc7850Fd6b2AAaB3d20Bfad713'

async function mint() {
    const nft = await ethers.getContractAt(contract.abi, contractAddress)
    const tx = await nft.mint(PUBLIC_KEY, TOKEN_URI);
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

