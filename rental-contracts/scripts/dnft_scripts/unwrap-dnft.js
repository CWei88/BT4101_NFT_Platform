require('dotenv').config()
const {ethers} = require('hardhat')

const PUBLIC_KEY = process.env.PUBLIC_KEY

async function unWrap() {
    let tokenId = '1'
    const signer = await ethers.getSigner(PUBLIC_KEY);
    console.log("Got Signer")

    let contractAddress = '0x1476377940d5C8fC1524F6f5C7580585fDFcfF52'
    //let a = provider.getSigner('0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C')
    const wrapperContract= require('../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json')
    const wrapTest = await ethers.getContractAt(wrapperContract.abi, contractAddress)

    const unwrap = await wrapTest.connect(signer).unwrapToken('1')
    const wTx = await unwrap.wait();
    console.log("Token unwrapped")

    let newAddress = wTx.events[2].address.toString();

    console.log(newAddress);
    console.log(`NFT of tokenId ${tokenId} unwrapped at address ${newAddress}`)

}

unWrap().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})