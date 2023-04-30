import { connectWallet, checkConnected } from './WalletLogin.js';
import jsonMarketData from '../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json';
import jsonNFTData from '../artifacts/contracts/RentableNFT.sol/RentableNFT.json';
import jsonDiffNFTData from '../artifacts/contracts/DiffTypeNFT.sol/DiffTypeNFT.json';
import jsonWrapperData from '../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json'
var Web3 = require('web3');
var web3 = new Web3(window.ethereum);

const REACT_APP_MARKET_ADDRESS = "0x51eEB2E8836030dC5d34B7e6c37c3Ab44D202d39"
const REACT_APP_WRAPPER_ADDRESS = "0x3dE1410ceE2053B2958731a548FF51B71ec4F131"
const REACT_APP_DNFT_ADDRESS = "0x71c172328A1f7146c98D31A0730FCc7c323D61A8"


const token_dnft = new web3.eth.Contract(
  jsonDiffNFTData.abi,
  REACT_APP_DNFT_ADDRESS
);
const Market = new web3.eth.Contract(
  jsonMarketData.abi,
  REACT_APP_MARKET_ADDRESS
);
const Wrapper = new web3.eth.Contract(
  jsonWrapperData.abi,
  REACT_APP_WRAPPER_ADDRESS
);

async function getMetaMaskAddress() {
  var address = '';
  await checkConnected().then(res => address = res);
  if (!address){
    await connectWallet().then(res => address = res);
    if (address == ''){
      return false;
    }
  }
  return address;
} 

async function getUserRarity(listings) {
    var userRarity = {}
    try {
        for (let i = 0; i < listings.length; i++) {
          var [uriResponse,user, owner, available] = ['','','',false]
          await getListingInfo(listings[i]).then(res=> {
            [uriResponse,user,owner, available] = res;
          })

          console.log(owner)
          console.log(user)
          console.log(available)
  
          //assign token rarity to user
          if (!available) {
            //the token is delisted
            console.log(`Delisted: ${uriResponse}`)
            continue
          } else if (user != 'None') {
            //count towards the user
            if (user in userRarity) {
              userRarity[user] = userRarity[user].concat(uriResponse['attributes'].map(attribute=>attribute['rarity']))
            } else {
              userRarity[user] = uriResponse['attributes'].map(attribute=>attribute['rarity'])
            }
            console.log(user)
            console.log(userRarity[user])
          } else {
            //count the token towards the owner
            if (owner in userRarity) {
              userRarity[owner] = userRarity[owner].concat(uriResponse['attributes'].map(attribute=>attribute['rarity']))
            } else {
              userRarity[owner] = uriResponse['attributes'].map(attribute=>attribute['rarity'])
            }
          }
        }
    } catch (error){
        console.log(error);
    }
    return userRarity;
}

async function getListingInfo(listing,address){
    var wrapperID = parseInt(listing['tokenId'])
    const owner = listing['owner']
    var available = listing['availableToRent']
    var tokenID = -1;
    var url = ''
    var uriResponse = ''
    var user = 'None';

    await Wrapper.methods.getTokenID(wrapperID).call({from:address}).then(res => {
        tokenID = res;
    })
    //get URI from URL
    await token_dnft.methods.tokenURI(tokenID).call({from:address}).then(res => {
        url = res
    })
    uriResponse = await fetch(url).then(res => {
        return res.json()
    });
    console.log(uriResponse);

    //skip this token if it does not have any attributes
    if (uriResponse['attributes'].length==0) {
        console.log(`No attributes: ${uriResponse}`)
    }
    //get user info
    await Wrapper.methods.userOf(wrapperID).call().then(res=> {
        if (res != '0x0000000000000000000000000000000000000000'){
        user = res;
        }
    })
    return [uriResponse, user, owner, available]

}

async function extractListingData(listing,address) {
    var price = parseInt(listing['pricePerDay'])
    var owner = listing['owner'].substring(0,6)+"..."+listing['owner'].substring(36)
    var minDays = parseInt(listing['minRentalDays']).toString()
    var maxDays = parseInt(listing['maxRentalDays']).toString()
    var wrapperID = parseInt(listing['tokenId'])
    var isDirect = listing['isDirect']
    var tokenAddress = ''
    var url = ''
    var response = ''
    var tokenID = -1;

    console.log(price)
    console.log(`Min days: ${minDays}`)
    console.log(`Max days: ${maxDays}`)

    await Wrapper.methods.getTokenID(wrapperID).call({from:address}).then(res => {
        tokenID = res;
    })
    console.log(tokenID)

    await Wrapper.methods.getTokenAddress(wrapperID).call({from:address}).then(res => {
        tokenAddress = res;
    })
    console.log(tokenAddress)
    await token_dnft.methods.tokenURI(tokenID).call({from:address}).then(res => {
        url = res
    })
    console.log(url)
    
    response = await fetch(url).then(res => {
        return res.json()
    });
    console.log(response);
    
    return [response,wrapperID,price,owner,`${minDays} - ${maxDays} days`,isDirect];

}

async function sendBiddingRequest(wrapperID, rentalDays,pricePerDay,address){
    await Market.methods.bidNFT(REACT_APP_WRAPPER_ADDRESS, wrapperID, rentalDays)
    .send({from:address,value:pricePerDay*rentalDays});
}

async function sendRentalRequest(wrapperID, rentalDays,pricePerDay,address){
  await Market.methods.rentNFT(REACT_APP_WRAPPER_ADDRESS, wrapperID, rentalDays)
    .send({from:address, value:pricePerDay*rentalDays});
}

async function fetchListings(address){
    var listings = []
    await Market.methods.getAvailableListings().call({from:address,gasLimit: 1000000}).then(result => {
        listings=result
      });
    return listings
}

export {extractListingData,sendBiddingRequest, sendRentalRequest, fetchListings, getListingInfo, getUserRarity,getMetaMaskAddress,token_dnft,Market,Wrapper};