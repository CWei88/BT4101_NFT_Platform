import {React,useState} from 'react';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded';
import TextField from '@mui/material/TextField';
import 'reactjs-popup/dist/index.css';
import {ethers} from 'ethers';
import jsonMarketData from '../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json';
import jsonNFTData from '../artifacts/contracts/RentableNFT.sol/RentableNFT.json';
import jsonDiffNFTData from '../artifacts/contracts/DiffTypeNFT.sol/DiffTypeNFT.json';
import jsonWrapperData from '../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {displayNFT} from '../components/Functions';


const {REACT_APP_SECONDARY_PRIVATE_KEY} = process.env

const REACT_APP_MARKET_ADDRESS = "0xe4aCB94E86479892f9ef6BF6EA2B8B86706366E3"
const REACT_APP_DNFT_ADDRESS = '0x71c172328A1f7146c98D31A0730FCc7c323D61A8'
const REACT_APP_WRAPPER_ADDRESS = '0xDd33C5352e0B768e4CB2019178A8eB78857AB8C4'

const owner_private = REACT_APP_SECONDARY_PRIVATE_KEY
const provider = new ethers.providers.Web3Provider(window.ethereum)
let signer = new ethers.Wallet(owner_private,provider);


const Market = new ethers.Contract(REACT_APP_MARKET_ADDRESS, jsonMarketData.abi,signer);
const token_dnft = new ethers.Contract(REACT_APP_DNFT_ADDRESS, jsonDiffNFTData.abi, signer);
const Wrapper= new ethers.Contract(REACT_APP_WRAPPER_ADDRESS,jsonWrapperData.abi,signer);

const Rent = () => {
  const [open, setOpen] = useState({});
  const [rentalDays, setRentalDays] = useState(0);
  const [pricePerDay, setPricePerDay] = useState(0);
  const handleClickOpen = (wrapperID) => {
    var openStatus = JSON.parse(JSON.stringify(open));
    openStatus[wrapperID]=true;
    setOpen(openStatus);
  };

  const handleClose = (wrapperID) => {
    var openStatus = JSON.parse(JSON.stringify(open));
    openStatus[wrapperID] = false;
    setOpen(openStatus);
  };

  async function biddingConfirmed(wrapperID){
    if (rentalDays<=0){
      alert('You must rent for at least 1 day')
    } else {
      try {
        await Market.bidNFT(REACT_APP_WRAPPER_ADDRESS, wrapperID, rentalDays, {value:pricePerDay*rentalDays}).then(res=>console.log(res))
        alert('Bidding Submitted Successfully!');
        setOpen(false);
      } catch(error) {
        alert(error.message.split('"')[3])
      }
    }
  }

  const [itemsList, setItemsList] = useState([])

  async function viewListings() {
    var listings = [];
    await Market.getAvailableListings({gasLimit: 1000000}).then(result => {
      listings=result
    });
    console.log(listings)
    var data = []
    var openStatus = {}
    for (let i = 0; i < listings.length; i++) {
      var available = listings[i]['availableToRent']
      if (!available) {
        continue;
      }
      var wrapperID = parseInt(listings[i]['tokenId'])
      var tokenID = -1;
      await Wrapper.getTokenID(wrapperID).then(res => {
        tokenID = res.toNumber();
      })
      var url = ''
      var response = ''
      var price = parseInt(listings[i]['pricePerDay'])
      var owner = listings[i]['owner'].substring(0,6)+"..."+listings[i]['owner'].substring(36)
      var minDays = parseInt(listings[i]['minRentalDays']).toString()
      var maxDays = parseInt(listings[i]['maxRentalDays']).toString()
      console.log(price)
      console.log(`Min days: ${minDays}`)
      console.log(`Max days: ${maxDays}`)

      openStatus[wrapperID] = false;

      await token_dnft.tokenURI(tokenID).then(res => {
        url = res
      })

      response = await fetch(url).then(res => {
        return res.json()
      });

      data.push([response,wrapperID,price,owner,`${minDays} - ${maxDays} days`]);
      setOpen(openStatus);
    }
    console.log(data)
    setItemsList(data);
  }

  function imageURL(item) {
    const rawURL = item['image'];
    const readyURL = rawURL.replace("ipfs://", "https://ipfs.io/ipfs/");
    return readyURL;
  }

  var userAuthenticated = true;
  

  if (userAuthenticated) { 

       var listItems = itemsList.map((item) =>
      <Grid item key={item[1]} xs={4}>
          <Card
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
          <div>{displayNFT(item)}</div>

              <CardActions sx={{paddingTop:1, flexDirection:'row', justifyContent:'space-between'}}>

                      <Grid>
                        <Typography>
                          Owner: {item[3]}
                        </Typography>
                      </Grid>
                      <Grid>
                        <Button variant='outlined' endIcon = {<AddCircleRoundedIcon />} onClick={() => handleClickOpen(item[1])}>
                        {item[2]} wei / Day
                        </Button>
                      </Grid>

                      <Dialog open={open[item[1]]} onClose={() => handleClose(item[1])}>
                      <DialogTitle fontWeight={'bold'}>Bid for this NFT</DialogTitle>
                      <DialogContent>
                        <DialogContentText fontStyle={'italic'}>
                          To rent this NFT, you will have to bid for it. The user will select a bid to accept tonight, if there are new bids. 
                          The selected bidder will start the rental at 12am the next day.
                        </DialogContentText>
                        <p></p>
                        <DialogContentText fontStyle={'italic'}>
                          Please enter your bidding details below. The duration must be between {item[4]}.
                        </DialogContentText>
                        <p></p>
                          <Grid container sx={{flexDirection: 'row',justifyContent:"space-around"}}>
                            <Grid>
                                <TextField sx={{input: {textAlign: "center"}}}
                                  required
                                  autoFocus
                                  margin="dense"
                                  id="totalPrice"
                                  label="Price"
                                  type="number"
                                  variant="outlined"
                                  onChange={(e)=>setPricePerDay(e.target.value)}
                                />
                              </Grid>
                              <Grid>
                                <TextField sx={{input: {textAlign: "center"}}}
                                  required
                                  autoFocus
                                  margin="dense"
                                  id="rental-days"
                                  label="Rental Duration (Days)"
                                  type="number"
                                  variant="outlined"
                                  onChange={(e)=>setRentalDays(e.target.value)}
                                />
                              </Grid>
                            </Grid>
                            <CardActions style={{ justifyContent: "space-between" }}>
                              <Button onClick={() => handleClose(item[1])}>Cancel</Button>
                              <Button onClick={() => biddingConfirmed(item[1])}>Confirm</Button>
                            </CardActions>
                      </DialogContent>
                    </Dialog>

              </CardActions>
          </Card>
        </Grid>);

      return (
          <div>
              <div>
              <p></p>
              <Container sx={{ flexDirection: 'row'}}>
              <Grid container rowspacing={1} columnspacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 4, md: 12 }} direction="row" justifyContent="space-evenly" alignItems="center">
              <Box textAlign='center'>
              <p></p>
              <Button variant="contained" onClick={viewListings} >
                Display Tokens for Rental
              </Button>
              <p></p>
              </Box>
              </Grid>
              </Container>
              <p></p>
              <p></p>
              <Container sx={{ flexDirection: 'row'}}>
                  <Grid container rowspacing={1} columnspacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 4, md: 12 }} direction="row" justifyContent="space-evenly" alignItems="center">
                      {listItems}
                  </Grid>
              </Container>
              </div>
              <p></p>
          </div>
      );
  } else {
      return (
          <div>
              <h1>Log in to View Your Listings</h1>
          </div>
      )
  }
};
  
export default Rent;