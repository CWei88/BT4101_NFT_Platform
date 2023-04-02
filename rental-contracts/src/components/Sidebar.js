import * as React from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import {ethers} from 'ethers';

import jsonMarketData from '../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json';
import jsonDiffNFTData from '../artifacts/contracts/DiffTypeNFT.sol/DiffTypeNFT.json';
import jsonWrapperData from '../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json'

const {REACT_APP_PRIVATE_KEY} = process.env
const REACT_APP_MARKET_ADDRESS = "0xe4aCB94E86479892f9ef6BF6EA2B8B86706366E3"
const REACT_APP_DNFT_ADDRESS = '0x71c172328A1f7146c98D31A0730FCc7c323D61A8'
const REACT_APP_WRAPPER_ADDRESS = "0xDd33C5352e0B768e4CB2019178A8eB78857AB8C4"

const owner_private = REACT_APP_PRIVATE_KEY
const provider = ((window.ethereum != null) ? new ethers.providers.Web3Provider(window.ethereum) : ethers.providers.getDefaultProvider());
let signer = new ethers.Wallet(owner_private,provider);


const Market = new ethers.Contract(REACT_APP_MARKET_ADDRESS,jsonMarketData.abi,signer);
const token_dnft = new ethers.Contract(REACT_APP_DNFT_ADDRESS,jsonDiffNFTData.abi,signer);
const Wrapper= new ethers.Contract(REACT_APP_WRAPPER_ADDRESS,jsonWrapperData.abi,signer);

function Sidebar(props) {
  const {description, social, title } = props;

  const [rarityInfo,setRarityInfo] = React.useState([]);

  async function getRarities(){
    var listings = []
    try {
      await Market.getAllListings({gasLimit: 1000000}).then(result => {
        listings=result
      })
    } catch(error) {
      alert(error);
      return;
    }
    var userRarity = {};
    try {
      for (let i = 0; i < listings.length; i++) {

        //get Token ID and Wrapper ID
        var wrapperID = parseInt(listings[i]['tokenId'])
        var tokenID = -1;
        await Wrapper.getTokenID(wrapperID).then(res => {
          tokenID = res.toNumber();
        })

        //get URI from URL
        var url = ''
        var uriResponse = ''
        await token_dnft.tokenURI(tokenID).then(res => {
            url = res
        })
        uriResponse = await fetch(url).then(res => {
          return res.json()
        });
        console.log(uriResponse);

        //skip this token if it does not have any attributes
        if (uriResponse['attributes'].length==0) {
          console.log(`skipped: ${uriResponse}`)
          continue;
        }

        //get user info
        var user = 'None';
        await Wrapper.userOf(wrapperID).then(res=> {
          if (res != '0x0000000000000000000000000000000000000000'){
            user = res;
          }
        })

        //get owner
        const owner = listings[i]['owner']

        //get availability
        var available = listings[i]['availableToRent']

        //assign token rarity to user
        if (!available) {
          //the token is delisted
          console.log(`Delisted: ${uriResponse}`)
          continue
        } else if (user != 'None') {
          //cout towards the user
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
            userRarity[owner] = userRarity[user].concat(uriResponse['attributes'].map(attribute=>attribute['rarity']))
          } else {
            userRarity[owner] = uriResponse['attributes'].map(attribute=>attribute['rarity'])
          }
          console.log(owner)
          console.log(user)
          console.log(available)
          console.log(userRarity[owner])
        }

      }

      var userRarityPair = [];
      for (user in userRarity){
        var sum = 0
        userRarity[user].forEach(element => {
          sum += element
        });
        userRarityPair.push({user:user, rarity_score:(sum/userRarity[user].length).toFixed(3)})
      }
      userRarityPair.sort(function(a,b){
        if (a.rarity_score > b.rarity_score){
          return 1
        } else {
          return -1
        }
      })
      setRarityInfo(userRarityPair);
    } catch (error) {
      console.log(error);
      alert(error);
      return;
    }
  }

  return (
    <Grid item xs={12} md={4}>
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.200' }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography>{description}</Typography>
      </Paper>
      <Button variant="outlined" gutterBottom sx={{ mt: 3 }} onClick={()=>getRarities()}>
        View Leaderboard
      </Button>
      <p></p>
      <Card>
        <Container flexDirection='row'>
        {rarityInfo.map((scores) => (
          <Grid container variant="body1" key={scores.user} display='flex' flexDirection='row' justifyContent={'space-between'}>
            <Typography>{rarityInfo.indexOf(scores)}</Typography>
            <Typography>{`${scores.user.substring(0,10)}...${scores.user.substring(30)}`}</Typography>
            <Typography>{scores.rarity_score}</Typography>
          </Grid>
        ))}
        </Container>
      </Card>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Social
      </Typography>
      {social.map((network) => (
        <Link
          display="block"
          variant="body1"
          href="#"
          key={network.name}
          sx={{ mb: 0.5 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <network.icon />
            <span>{network.name}</span>
          </Stack>
        </Link>
      ))}
    </Grid>
  );
}

Sidebar.propTypes = {
  leaderboard: PropTypes.arrayOf(
    PropTypes.shape({
      username: PropTypes.string.isRequired,
      rarityScore: PropTypes.string.isRequired,
    }),
  ).isRequired,
  description: PropTypes.string.isRequired,
  social: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.elementType.isRequired,
      name: PropTypes.string.isRequired,
    }),
  ).isRequired,
  title: PropTypes.string.isRequired,
};

export default Sidebar;