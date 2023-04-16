import {ethers} from 'ethers';
import jsonMarketData from '../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json';
import jsonNFTData from '../artifacts/contracts/RentableNFT.sol/RentableNFT.json';
import jsonDiffNFTData from '../artifacts/contracts/DiffTypeNFT.sol/DiffTypeNFT.json';
import jsonWrapperData from '../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json'

const {REACT_APP_PRIVATE_KEY} = process.env
const REACT_APP_MARKET_ADDRESS = "0x51eEB2E8836030dC5d34B7e6c37c3Ab44D202d39"
const REACT_APP_WRAPPER_ADDRESS = "0x3dE1410ceE2053B2958731a548FF51B71ec4F131"
const REACT_APP_DNFT_ADDRESS = "0x71c172328A1f7146c98D31A0730FCc7c323D61A8"

const owner_private = REACT_APP_PRIVATE_KEY
const provider = ((window.ethereum != null) ? new ethers.providers.Web3Provider(window.ethereum) : ethers.providers.getDefaultProvider());
let signer = new ethers.Wallet(owner_private,provider);

const token_dnft = new ethers.Contract(REACT_APP_DNFT_ADDRESS,jsonDiffNFTData.abi,signer);
const Market = new ethers.Contract(REACT_APP_MARKET_ADDRESS,jsonMarketData.abi,signer);
const Wrapper= new ethers.Contract(REACT_APP_WRAPPER_ADDRESS,jsonWrapperData.abi,signer);

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

async function getListingInfo(listing){
    var wrapperID = parseInt(listing['tokenId'])
    const owner = listing['owner']
    var available = listing['availableToRent']
    var tokenID = -1;
    var url = ''
    var uriResponse = ''
    var user = 'None';

    await Wrapper.getTokenID(wrapperID).then(res => {
        tokenID = res.toNumber();
    })
    //get URI from URL
    await token_dnft.tokenURI(tokenID).then(res => {
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
    await Wrapper.userOf(wrapperID).then(res=> {
        if (res != '0x0000000000000000000000000000000000000000'){
        user = res;
        }
    })
    return [uriResponse, user, owner, available]

}

async function extractListingData(listing) {
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

    await Wrapper.getTokenID(wrapperID).then(res => {
        tokenID = res.toNumber();
    })
    await Wrapper.getTokenAddress(wrapperID).then(res => {
        tokenAddress = res;
    })
    //var token_dnft = getTokenContract(tokenAddress,signer);
    await token_dnft.tokenURI(tokenID).then(res => {
        url = res
    })
    
    response = await fetch(url).then(res => {
        return res.json()
    });
    console.log(response);
    
    return [response,wrapperID,price,owner,`${minDays} - ${maxDays} days`,isDirect];

}

async function sendBiddingRequest(wrapperID, rentalDays,pricePerDay){
    await Market.bidNFT(REACT_APP_WRAPPER_ADDRESS, wrapperID, rentalDays, {value:pricePerDay*rentalDays})
}

async function sendRentalRequest(wrapperID, rentalDays,pricePerDay){
    await Market.rentNFT(REACT_APP_WRAPPER_ADDRESS, wrapperID, rentalDays, {value:pricePerDay*rentalDays});
}

async function fetchListings(){
    var listings = []
    await Market.getAvailableListings({gasLimit: 1000000}).then(result => {
        listings=result
      });
    return listings
}

export {extractListingData,sendBiddingRequest, sendRentalRequest, fetchListings, getListingInfo, getUserRarity};