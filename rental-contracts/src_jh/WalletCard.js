import React, {useState} from 'react';
import ReactDOM from "react-dom";
const ethers = require("ethers")

const WalletCard = ({childToParent}) => {
    const [errorMessage, setErrorMessage] = useState(null);
    const [defaultAccount, setDefaultAccount] = useState(null);
    const [userBalance, setUserBalance] = useState(null);


    const connectWallet = () => {
        if (window.ethereum) {
            window.ethereum.request({method: 'eth_requestAccounts'})
            .then(result => {
                accountChanged([result[0]]);
                childToParent(defaultAccount);
            })        
        } else {
            setErrorMessage('Install MetaMask Please')
        }
    }

    const accountChanged = (accountName) => {
        setDefaultAccount(accountName)
        getUserBalance(accountName)
    } 


    const getUserBalance = (accountAddress) => {
        window.ethereum.request({method: 'eth_getBalance', params: [String(accountAddress),"latest"]})
        .then(balance => {
            setUserBalance(ethers.utils.formatEther(balance))
        })
    }

    return (
        <div>
            <h1>MetaMask Wallet Connection</h1>

            <button onClick={connectWallet}>Connect to MetaMask</button>
            <h3>Address: {defaultAccount}</h3>
            <h3>Balance(ETH): {userBalance}</h3>

            {errorMessage}
        </div>
    )
}

export default WalletCard;