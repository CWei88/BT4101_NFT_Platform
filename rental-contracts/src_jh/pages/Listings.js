import {React,useState} from "react";
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import jsonMarketData from '../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json';
import jsonNFTData from '../artifacts/contracts/RentableNFT.sol/RentableNFT.json';
import jsonDiffNFTData from '../artifacts/contracts/DiffTypeNFT.sol/DiffTypeNFT.json';
import jsonWrapperData from '../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json'
import ButtonGroup from '@mui/material/ButtonGroup';
import {ethers} from 'ethers';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import GradingRoundedIcon from '@mui/icons-material/GradingRounded';
import detectEthereumProvider from '@metamask/detect-provider';
import {checkConnected} from './WalletLogin.js'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

//require('dotenv').config();
//const alchemyKey = process.env.REACT_APP_ALCHEMY_KEY;
//const { createAlchemyWeb3 } = require("@alch/alchemy-web3");
//const web3 = createAlchemyWeb3(alchemyKey);

const {REACT_APP_PRIVATE_KEY,REACT_APP_PUBLIC_KEY} = process.env
console.log(REACT_APP_PRIVATE_KEY)

const REACT_APP_RNFT_ADDRESS ="0x0E99b6eEAF4777b8D3b9A6dEd29a363df43adED3"
const REACT_APP_MARKET_ADDRESS = "0xaA46f05c13de12e3E8B19523b7Fb0DcaD0DA74D3"
const REACT_APP_DNFT_ADDRESS = '0x1bD38a2295a409b4413a61A4202afbb1fe0A4542'
const REACT_APP_WRAPPER_ADDRESS = "0x514393f3D95262Ac952433484dE9aCd031Ea0b78"

const owner_private = REACT_APP_PRIVATE_KEY
const owner_public = REACT_APP_PUBLIC_KEY
const provider = new ethers.providers.Web3Provider(window.ethereum)
let signer = new ethers.Wallet(owner_private,provider);


const Market = new ethers.Contract(REACT_APP_MARKET_ADDRESS,jsonMarketData.abi,signer);
const token = new ethers.Contract(REACT_APP_RNFT_ADDRESS,jsonNFTData.abi,signer);
const token_dnft = new ethers.Contract(REACT_APP_DNFT_ADDRESS,jsonDiffNFTData.abi,signer);
const Wrapper= new ethers.Contract(REACT_APP_WRAPPER_ADDRESS,jsonWrapperData.abi,signer);

const Listings=()=>{

  //View Bids Dialog
  const [itemsList, setItemsList] = useState([])
  const [listMessage,setListMessage] = useState('')
  const [open, setOpen] = useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  //Delist Dialog
  const [openDelist, setOpenDelist] = useState(false);
  const handleClickOpenDelist = () => {
    setOpenDelist(true);
  };
  const handleCloseDelist = () => {
    setOpenDelist(false);
  };

  async function wrap(id) {
    //const approval = await token_dnft.approve(REACT_APP_WRAPPER_ADDRESS,id);
    console.log('Wrapper Contract Approved')
    setListMessage('Loading: Wrapper Contract Approved...')

    await token_dnft.ownerOf(id).then(res => console.log(res));
    const wrap = await Wrapper.wrapToken(REACT_APP_DNFT_ADDRESS,id,{'gasPrice':10000000000,'gasLimit':250000});
    const wTx = await wrap.wait();
    await token_dnft.ownerOf(id).then(res => console.log(res));
    //console.log(wTx.events)
    let newAddress = wTx.events[2].address.toString();
    console.log(`NFT of tokenId ${id} wrapped at address ${newAddress}`)
    setListMessage(`LoadingL NFT of tokenId ${id} wrapped at address ${newAddress}...`)
    //return newAddress
   }

   async function unwrap(id){
    const unwrap = await Wrapper.unwrapToken(id)
    const wTx = await unwrap.wait();
    console.log("Token unwrapped")

    let newAddress = wTx.events[2].address.toString();

    console.log(`NFT of tokenId ${id} unwrapped at address ${newAddress}`)
   }

  async function list() {
    const listingDuration = 1
    const currWrapperId  = 2
    setListMessage('Loading: Wrapping NFT...')

    const tokenId = document.getElementById('tokenid').value
    console.log(tokenId)
    const price = document.getElementById('price').value
    const minDays = document.getElementById('min-days').value
    const maxDays = document.getElementById('max-days').value
    const tokenAddress = document.getElementById('nft-address').value

    await wrap(tokenId);

    console.log('User authorising market')
    setListMessage('Loading: Authorizing the market...')

    try {
      let approval = await Wrapper.approve(REACT_APP_MARKET_ADDRESS, currWrapperId,
      {gasPrice: 50000000000})
      await approval.wait()
    } catch (error) {
      alert(error)
      return;
    }

    console.log('Market Approved')

    console.log("Listing NFT")
    setListMessage('Loading: Listing NFT...')
    let expiryTime = Math.round(new Date().getTime() / 1000) + (listingDuration*24*60*60)

    try{
      await Wrapper.ownerOf(currWrapperId).then(res => console.log(res))
      let listTx = await Market.listNFT(REACT_APP_WRAPPER_ADDRESS, currWrapperId, price,minDays,maxDays, expiryTime,{value:1});
      await listTx.wait()
      console.log("NFT Listed")

      //window.setTimeout(delist(REACT_APP_WRAPPER_ADDRESS,1),24*60*60*60*1000)
      setListMessage(`Congrats, NFT has been listed successfully! Your listing will expire at ${new Date(expiryTime*1000)}`)
    } catch(error) {
      alert(error)
      return;
    }
  }

  async function viewOwnedListings() {
    var listings = [];
    await Market.getOwnedListings({gasLimit: 1000000}).then(result => {
      listings=result
    })

    console.log(listings)
    var data = []
    for (let i = 0; i < listings.length; i++) {
      var id = parseInt(listings[i]['tokenId'])
      var url = ''
      var response = ''
      var price = parseInt(listings[i]['pricePerDay'])
      console.log(price)
      await token_dnft.tokenURI(8).then(res => {
          url = res
      })
      console.log(url)

      response = await fetch(url).then(res => {
        return res.json()
      });

      data.push([response,id,price])
    }
    console.log(data)
    setItemsList(data);
  }

  function imageURL(item) {
    const rawURL = item['image'];
    const readyURL = rawURL.replace("ipfs://", "https://ipfs.io/ipfs/");
    return readyURL;
  }

  async function getBids(id){
    try{
      var bids = []
      await Market.getAllBids(REACT_APP_WRAPPER_ADDRESS,id).then(res=>{
        bids=res;
      })
      var results = []
      for (let i = 0; i<bids.length;i++){
        results.push({'rentee':bids[i].rentee,'Price Per Day': bids[i].pricePerDay,'Rental Duration':bids[i].rentalDays})
      }
      console.log(bids)
      return bids.map(bid=>{
        <Grid>
          <Typography>Rentee: {bid['rentee']}</Typography>
          <Typography>Price: {bid['Price Per Day']}</Typography>
          <Typography>Rental Duration: {bid['Rental Duration']}</Typography>
        </Grid>
      })
    } catch(error) {
      alert(error)
    }
  }


  async function delist(id) {
    handleCloseDelist();
    console.log("Delisting NFT")
    const currWrapperId = 2
    await token_dnft.ownerOf(id).then(res=>console.log(`Owner: ${res}`))
    let delistTx = await Market.delistNFT(REACT_APP_WRAPPER_ADDRESS, currWrapperId)
    await delistTx.wait()

    await token_dnft.ownerOf(id).then(res=>console.log(`Owner: ${res}`))
    try {
      await unwrap(currWrapperId)
      console.log(`NFT ${id} delisted`)
    } catch (error) {
      alert(error)
    }
  }
  
  const gridStyles = {
    backgroundColor: "black",
    marginLeft: "auto",
    marginRight: "auto",
    paddingRight: 1,
    paddingBottom: 1
  };

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
        result[i] = (
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
         sx={{ height: '48vw', display: 'flex', flexDirection: 'column' }}
       >
         <div>
         <CardMedia
           component="img"
           sx={{
             // 16:9
             pt: 0,
             height: 200
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

              <CardActions style={{justifyContent:'center', alignItems:'left',flexDirection:'column'}}>
                <ButtonGroup sx={{height:'2vw'}} variant='text'>
                  <Button onClick={handleClickOpen} startIcon={<GradingRoundedIcon />}>View Bids</Button>
                  <Button startIcon={<EditIcon />}> {item[2]} wei/Day </Button>
                  <Button onClick={handleClickOpenDelist} fontSize='small' startIcon={<DeleteIcon />}>Delete</Button>
                </ButtonGroup>

                <Dialog open={openDelist} onClose={handleCloseDelist}>
                  <DialogTitle id="alert-dialog-title">
                    {"Are You sure to delist the token?"}
                  </DialogTitle>
                  <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                      The action is irreversible. To re-list the token, you will have to do it from scratch and pay listing fee again.
                    </DialogContentText>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleCloseDelist}>Disagree</Button>
                    <Button onClick={()=>delist(item[1])} autoFocus>
                      Agree
                    </Button>
                  </DialogActions>
                </Dialog>

                <Dialog open={open}>
                  <DialogTitle variant='h4' fontSize={20} fontWeight={'bold'}>
                    Approve Bid
                  </DialogTitle>
                  <DialogContent>
                    <Grid container>
                    </Grid>
                  </DialogContent>
                  <DialogActions style={{flexDirection:'row',justifyContent:'space-between'}}>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button>Accept Bid</Button>
                  </DialogActions>
                </Dialog>

              </CardActions>
          </Card>
        </Grid>);

      return (
          <div>
              <div>
              <Container>
              <Card>
              <Box
                component="form"
                sx={{
                  '& .MuiTextField-root': { m: 1, width: '25ch' },
                }}
                noValidate
                autoComplete="off"
              >
                <div>
                <Typography gutterBottom variant="h9" sx={{m:2}} component="h3">
                  List your token for rental and earn rental fees today!
                </Typography>
                <Grid container spacing={0}>
                <Grid item sm={3}>
                    <TextField
                      required
                      id="nft-address"
                      fullWidth
                      label='NFT Address'
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item sm={3}>
                    <TextField
                      required
                      id="tokenid"
                      fullWidth
                      label='Token ID'
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item sm={3}>
                    <TextField
                      required
                      id="price"
                      fullWidth
                      label="Price per Day"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item sm={3}>
                    <TextField
                      required
                      id="min-days"
                      fullWidth
                      label="Min Number of Rental Days"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item sm={2}>
                    <TextField
                      required
                      id="max-days"
                      fullWidth
                      label="Max Number of Rental Days"
                      variant="outlined"
                    />
                  </Grid>
                  <Container sx={{ flexDirection: 'row'}}>
                  <Grid container rowspacing={1} columnspacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 4, md: 12 }} direction="row" justifyContent="flex-start" alignItems="center">
                  <Button sm ={2} sx={{m:2}} variant="contained" onClick={list}>List this NFT</Button>
                  <Typography>{listMessage}</Typography>
                  </Grid>
                  </Container>
                </Grid>
                </div>
              <p></p>
              </Box>
              </Card>
              </Container>
              <p></p>
              <Container sx={{ flexDirection: 'row'}}>
              <Grid container rowspacing={1} columnspacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 4, md: 12 }} direction="row" justifyContent="space-evenly" alignItems="center">
              <Box textAlign='center'>
              <p></p>
              <Button variant="contained" onClick={viewOwnedListings} >
                Display My Listed Tokens
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
  
export default Listings;
