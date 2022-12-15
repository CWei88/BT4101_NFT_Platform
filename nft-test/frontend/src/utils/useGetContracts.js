import VoteManager from '../../artifacts/contracts/VoteManager.sol/VoteManager.json';
const {ethers} = require('hardhat');

export default function getContract(contractAddress) { 
    const provider = new ethers.provider.Web3Provider((window).ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, VoteManager.abi, signer);

    return contract;
}