const connectWallet= () => {
    if (window.ethereum) {
        window.ethereum.request({method: 'eth_requestAccounts'})
        .then(result => {
            return [result[0]];
        })        
    } else {
        return '';
    }
}

async function checkConnected(){
    const accounts = await window.ethereum.request({method: 'eth_accounts'})
    return accounts[0] || false;
}

export {connectWallet,checkConnected};