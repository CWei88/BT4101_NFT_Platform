const connectWallet= () => {
    async function connectWallet(){
        if (window.ethereum) {
            await window.ethereum.request({method: 'eth_requestAccounts'})   
        } else {
            alert('Install MetaMask Please')
        }
    }
    connectWallet();
}

async function checkConnected(){
    return await window.ethereum.request({method: 'eth_accounts'})[0] || false;
}

export {connectWallet,checkConnected};