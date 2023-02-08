require('dotenv').config()
const {ethers} = require('hardhat')

const PUBLIC_KEY = process.env.PUBLIC_KEY;

async function wrap() {
    const wrapper = await ethers.getContractFactory("ERC4907Wrapper")
    const wToken = await wrapper.deploy('0xaD09F27B6646f90AB4827A7dC22C5F975869050c', "Wrapped DNFT", "WDNFT")

    await wToken.deployed();

    console.log(wToken.address)
    console.log("Wrapper deployed");

    let tokenId = '1'
    let provider = ethers.getDefaultProvider('goerli')
    let signer = new ethers.providers.JsonRpcProvider('0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C')
    const wrap = await wToken.connect(signer).wrapToken('0');
    const wTx = await wrap.wait();

    let newAddress = wTx.events[2].address.toString();

    console.log(newAddress);
    console.log(`NFT of tokenId ${tokenId} wrapped at address ${newAddress}`)

}

wrap().then(() => process.exit(0))
.catch((err) => {
    console.log(err)
    process.exit(1)
})