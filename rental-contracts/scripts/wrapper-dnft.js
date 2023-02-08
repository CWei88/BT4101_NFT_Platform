require('dotenv').config()
const {ethers} = require('hardhat')

const PUBLIC_KEY = process.env.PUBLIC_KEY;

async function deployWrapper() {
    const wrapper = await ethers.getContractFactory("ERC4907Wrapper")
    const wToken = await wrapper.deploy('0xaD09F27B6646f90AB4827A7dC22C5F975869050c', "Wrapped DNFT", "WDNFT")

    await wToken.deployed();

    console.log(wToken.address)
    console.log("Wrapper deployed");
}

async function wrap() {

    let tokenId = '1'
    const signer = await ethers.getSigner(PUBLIC_KEY);
    console.log("Got Signer")

    let contractAddress = '0x1476377940d5C8fC1524F6f5C7580585fDFcfF52'
    //let a = provider.getSigner('0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C')
    const wrapperContract= require('../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json')
    const wrapTest = await ethers.getContractAt(wrapperContract.abi, contractAddress)
    const token= require('../artifacts/contracts/DiffTypeNFT.sol/DiffTypeNFT.json')
    const tokenAddress = '0xaD09F27B6646f90AB4827A7dC22C5F975869050c'
    const tokenTest = await ethers.getContractAt(token.abi, tokenAddress);
    await tokenTest.approve(contractAddress, '1')
    console.log('Contract Approved')
    const wrap = await wrapTest.connect(signer).wrapToken('1');
    const wTx = await wrap.wait();

    let newAddress = wTx.events[2].address.toString();

    console.log(newAddress);
    console.log(`NFT of tokenId ${tokenId} wrapped at address ${newAddress}`)

}

wrap().then()
.catch((err) => {
    console.log(err)
    process.exit(1)
})