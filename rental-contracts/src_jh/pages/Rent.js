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


const {REACT_APP_PUBLIC_KEY, REACT_APP_PRIVATE_KEY} = process.env

const REACT_APP_RNFT_ADDRESS ="0x0E99b6eEAF4777b8D3b9A6dEd29a363df43adED3"
const REACT_APP_MARKET_ADDRESS = "0xaA46f05c13de12e3E8B19523b7Fb0DcaD0DA74D3"
const REACT_APP_DNFT_ADDRESS = '0x1bD38a2295a409b4413a61A4202afbb1fe0A4542'
const REACT_APP_WRAPPER_ADDRESS = '0x514393f3D95262Ac952433484dE9aCd031Ea0b78'

const owner_private = REACT_APP_PRIVATE_KEY
const owner_public = REACT_APP_PUBLIC_KEY
const provider = new ethers.providers.Web3Provider(window.ethereum)
let signer = new ethers.Wallet(owner_private,provider);


const Market = new ethers.Contract(REACT_APP_MARKET_ADDRESS, jsonMarketData.abi,signer);
const token = new ethers.Contract(REACT_APP_RNFT_ADDRESS, jsonNFTData.abi, signer);
const token_dnft = new ethers.Contract(REACT_APP_DNFT_ADDRESS, jsonDiffNFTData.abi, signer);
const Wrapper= new ethers.Contract(REACT_APP_WRAPPER_ADDRESS,jsonWrapperData.abi,signer);

const Rent = () => {
  const [open, setOpen] = useState(false);
  const [rentalDays, setRentalDays] = useState(0);
  const [pricePerDay, setPricePerDay] = useState(0);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  async function biddingConfirmed(id){
    if (rentalDays<=0){
      alert('You must rent for at least 1 day')
    } else {
      try {
        await Market.bidNFT(REACT_APP_WRAPPER_ADDRESS, id, rentalDays, {value:pricePerDay*rentalDays}).then(res=>console.log(res))
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
    for (let i = 0; i < listings.length; i++) {
      var id = parseInt(listings[i]['tokenId'])
      var url = ''
      var response = ''
      var price = parseInt(listings[i]['pricePerDay'])
      var owner = listings[i]['owner'].substring(0,6)+"..."+listings[i]['owner'].substring(36)
      var minDays = parseInt(listings[i]['minRentalDays']).toString()
      var maxDays = parseInt(listings[i]['maxRentalDays']).toString()
      console.log(price)
      await token_dnft.tokenURI(id).then(res => {
          url = res
      })
      console.log(url)

      response = await fetch(url).then(res => {
        return res.json()
      });

      data.push([response,id,price,owner,`${minDays} - ${maxDays} days`])
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

    function displayAttributes(object){
      var result = []
      const length = object.length
      for (let i=0; i < length; i++) {
        var attribute = object[i]
        var trait = attribute['trait']
        if (!trait) {
          trait = attribute['trait_type']
        }
        result.push(
          <Grid item key={trait} xs={4} >
            <Card rowspacing={1} columnspacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 3, sm: 3 }} sx={{height: '80%', width:'7.5vw',display:'flex', flexDirection: 'column'}}>
            <CardContent sx={{backgroundColor:'#64b5f6',paddingTop:0.5,paddingBottom:1,paddingLeft:1,paddingRight:1}}>
            <Typography variant ='h6' fontFamily={'"Apple Color Emoji"'} fontSize={16} fontWeight={900} color={'white'}>
              {trait}
            </Typography>
            <Typography variant='caption' fontFamily={'arial'} fontSize={11} fontWeight={400} color='white'>
              {attribute['value']}
            </Typography>
            </CardContent>
            </Card>
          </Grid>
        )
      }
      return result;
    } 

       var listItems = itemsList.map((item) =>
      <Grid item key={item[1]} xs={4}>
          <Card
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <div>
            <CardMedia
              component="img"
              sx={{
                // 16:9
                pt: 0,
                height: '100%'
              }}
              image={imageURL(item[0])}
              alt="random"
            />
            </div>
              <CardContent sx={{ flexGrow: 1}}>
                <Typography gutterBottom variant="h5" fontSize={30} component="h2" fontWeight={'bold'} height={'3vw'} fontFamily='cursive'>
                  {item[0]['name']}
                </Typography>
                <Typography variant="body" fontWeight={'medium'}>
                  Description:
                </Typography>
                <Typography fontFamily={'Raleway'} fontStyle={'italic'} fontWeight={'light'}>
                  {item[0]['description']}
                </Typography>
                <Typography variant="h9" component="h2">
                </Typography>
              </CardContent>

              <Container sx={{ flexDirection: 'row', paddingLeft:0, paddingTop:0}}>
                  <Grid container spacing={0} rowspacing={-2} direction="row" justifyContent="flex-start" alignItems="left">
                      {displayAttributes(item[0]['attributes'])}
                  </Grid>
              </Container>

              <CardActions sx={{paddingTop:1, flexDirection:'row', justifyContent:'space-between'}}>

                      <Grid>
                        <Typography>
                          Owner: {item[3]}
                        </Typography>
                      </Grid>
                      <Grid>
                        <Button variant='outlined' endIcon = {<AddCircleRoundedIcon />} onClick={handleClickOpen}>
                        {item[2]} wei / Day
                        </Button>
                      </Grid>
                    <Dialog open={open} onClose={handleClose}>
                      <DialogTitle fontWeight={'bold'}>Bid for this NFT</DialogTitle>
                      <DialogContent>
                        <DialogContentText fontStyle={'italic'}>
                          To rent this NFT, you will have to bid for it. The owner of the NFT will determine the successful
                          rentee of the NFT on every Sunday night. If you are selected, your rental will start immediately then.
                          Please enter your rental requirements below. The duration must be between {item[4]}.
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
                                  helperText="Total Price to Pay"
                                  onChange={(e)=>setPricePerDay(e.target.value)}
                                />
                              </Grid>
                              <Grid>
                                <TextField sx={{input: {textAlign: "center"}}}
                                  required
                                  autoFocus
                                  margin="dense"
                                  id="rental-days"
                                  label="Rental Duration"
                                  type="number"
                                  variant="outlined"
                                  helperText="Rental Duration (Days)"
                                  onChange={(e)=>setRentalDays(e.target.value)}
                                />
                              </Grid>
                            </Grid>
                            <CardActions style={{ justifyContent: "space-between" }}>
                              <Button onClick={handleClose}>Cancel</Button>
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