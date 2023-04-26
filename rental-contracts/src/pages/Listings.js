import {React,useState} from "react";
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import jsonMarketData from '../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json';
import jsonDiffNFTData from '../artifacts/contracts/DiffTypeNFT.sol/DiffTypeNFT.json';
import jsonWrapperData from '../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json'
import ButtonGroup from '@mui/material/ButtonGroup';
import {ethers} from 'ethers';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import GradingRoundedIcon from '@mui/icons-material/GradingRounded';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {displayNFT} from '../components/Functions.js'
import { getMetaMaskAddress,token_dnft,Market,Wrapper} from "../components/BlockchainFunc";
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';

const REACT_APP_MARKET_ADDRESS = "0x51eEB2E8836030dC5d34B7e6c37c3Ab44D202d39"
const REACT_APP_WRAPPER_ADDRESS = "0x3dE1410ceE2053B2958731a548FF51B71ec4F131"
const REACT_APP_DNFT_ADDRESS = "0x71c172328A1f7146c98D31A0730FCc7c323D61A8"

//const token_dnft = new ethers.Contract(REACT_APP_DNFT_ADDRESS,jsonDiffNFTData.abi,signer);
//const Market = new ethers.Contract(REACT_APP_MARKET_ADDRESS,jsonMarketData.abi,signer);
//const Wrapper= new ethers.Contract(REACT_APP_WRAPPER_ADDRESS,jsonWrapperData.abi,signer);

const Listings=()=>{

  //View Bids Dialog
  const [itemsList, setItemsList] = useState([]);
  const [listMessage,setListMessage] = useState('');
  const [openDelist, setOpenDelist] = useState({});
  const [open, setOpen] = useState({});
  const [bids,setBids] = useState([]);
  const [haveBids,setHaveBids] = useState(false);
  const [noListingMessage,setNoListingMessage] = useState(false);
  const [dnftAddress, setDnftAddress] = useState('')
  const [bidRequired,setBidRequired] = useState(false)
  const [address, setAddress] = useState('unconnected');

  const handleClickOpen = (wrapperID) => {
    var openStatus = JSON.parse(JSON.stringify(open));
    openStatus[wrapperID]=true;
    setOpen(openStatus);

    getBids(wrapperID);
  };
  const handleClose = (wrapperID) => {
    var openStatus = JSON.parse(JSON.stringify(open));
    openStatus[wrapperID] = false;
    setOpen(openStatus);
  };

  //Delist Dialog
  const handleClickOpenDelist = (wrapperID) => {
    var openStatus = JSON.parse(JSON.stringify(openDelist));
    openStatus[wrapperID]=true;
    setOpenDelist(openStatus);
  };
  const handleCloseDelist = (wrapperID) => {
    var openStatus = JSON.parse(JSON.stringify(openDelist));
    openStatus[wrapperID] = false;
    setOpenDelist(openStatus);
  };

  async function connectMetaMask() {
    if (address == 'unconnected') {
      alert('Checking Connection...')
      var addr = '';
      await getMetaMaskAddress().then(res=>addr = res);
      if (!addr) {
        alert('Please install MetaMask first.');
        return false;
      } else {
        alert(`Your are connected to ${addr}`)
        setAddress(addr);
      }
    } else {
      alert(`Your are connected to ${address}`);
    }
    return true;
  }

  async function wrap(id) {
    //original token approve wrapper contract
    //const token_dnft = getTokenContract(dnftAddress,signer);
    try {
      await token_dnft.methods.approve(REACT_APP_WRAPPER_ADDRESS,id).send({from:address});
      console.log('Wrapper Contract Approved')
      setListMessage('Loading: Wrapper Contract Approved...')
    } catch (error) {
      alert(error);
      return -1;
    }

    setListMessage('Loading: Wrapping Token')
    var wrapperID = -1;
    try {
      var wTx = '';
      await Wrapper.methods.wrapToken(dnftAddress,id)
      .send({from:address,gasPrice:10000000000,gasLimit:250000})
      .then(res=>{
        wTx = res;
      });
      wrapperID = parseInt(wTx.events.TokenWrapped.returnValues.tokenId,10);
      console.log(`Wrapper ID: ${wrapperID} as ${typeof(wrapperID)}`)
      console.log('Token wrapped')

      await token_dnft.methods.ownerOf(id).call().then(res => {
        setListMessage(`Loading: Current owner becomes: ${res}`)
        console.log(`Loading: Current owner becomes: ${res}`)
        console.log('wrapped')
        setListMessage('Loading: Token wrapped')
      });
    } catch (error) {
      console.log(error);
      alert(error);
    }
    return wrapperID;
   }

   async function unwrap(wrapperID){
    await Wrapper.methods.unwrapToken(wrapperID).send({from:address});
    console.log("Token unwrapped")

    console.log(`NFT of wrapperId ${wrapperID} unwrapped`)
   }

  async function list() {
    if (!connectMetaMask){
      return;
    }

    setListMessage('')
    const listingDuration = 7;

    const tokenId = document.getElementById('tokenid').value
    console.log(tokenId)
    const price = document.getElementById('price').value
    const minDays = document.getElementById('min-days').value
    const maxDays = document.getElementById('max-days').value
    //const tokenAddress = document.getElementById('nft-address').value
    if (bidRequired == NaN) {
      console.log('undefined');
      return;
    }

    var wrapperID = -1;

    await wrap(tokenId).then(res=>{
      wrapperID=res
    });
    if (wrapperID == -1) {
      setListMessage('Unsuccessful at wrapping:(')
      console.log('Unsuccessful at wrapping')
      return;
    }

    console.log(`Wrapper ID is ${wrapperID}`)
    setListMessage(`Loading: The wrapper ID assigned is ${wrapperID}`)

    console.log('User authorising market')
    setListMessage('Loading: Authorizing the market...')
 
    try {
      await Wrapper.methods.approve(REACT_APP_MARKET_ADDRESS, wrapperID).send({from:address})
    } catch (error) {
      alert(error)
      setListMessage('Unsuccessful at listing:(')
      return;
    }

    console.log('Market Approved')

    console.log("Listing NFT")
    setListMessage('Loading: Listing NFT...')
    let expiryTime = Math.round(new Date().getTime() / 1000) + (listingDuration*24*60*60)

    try{
      var listingFee = 0;
      await Market.methods.getListingFee().call().then(res => listingFee = res);
      await Wrapper.methods.ownerOf(wrapperID).call().then(res => console.log(res))
      await Market.methods
      .listNFT(REACT_APP_WRAPPER_ADDRESS, wrapperID, price,minDays,maxDays, expiryTime,!bidRequired)
      .send({from:address,value:listingFee});
      console.log("NFT Listed")
      await Wrapper.methods.ownerOf(wrapperID).call().then(res => console.log(`Wrapper token owner now becomes: ${res}`))

      //window.setTimeout(delist(REACT_APP_WRAPPER_ADDRESS,1),24*60*60*60*1000)
      setListMessage(`Congrats, NFT has been listed successfully! Your listing will expire at ${new Date(expiryTime*1000)}`)
    } catch(error) {
      alert(error)
      setListMessage('Unsuccessful at listing :(')
      return;
    }
  }

  async function getListings(listings){

    console.log(listings)
    var data = []
    for (let i = 0; i < listings.length; i++) {
      var available = listings[i]['availableToRent']
      var wrapperID = parseInt(listings[i]['tokenId'])
      var price = parseInt(listings[i]['pricePerDay'])
      var isDirect = listings[i]['isDirect']
      var tokenID = -1;
      var user = 'None';
      var url = ''
      var response = ''
      var tokenAddress = '';

      if (!available) {
        continue;
      }
      await Wrapper.methods.userOf(wrapperID).call().then(res=> {
        if (res != '0x0000000000000000000000000000000000000000'){
          user = `${res.substring(0,10)}...${res.substring(30)}`;
        } else {
          user = 'The token has not been rented out'
        }
      })

      await Wrapper.methods.getTokenID(wrapperID).call({from:address}).then(res => {
        tokenID = res;
      })
      await Wrapper.methods.getTokenAddress(wrapperID).call({from:address}).then(res => {
        tokenAddress = res;
      })
      //var token_dnft = getTokenContract(tokenAddress,signer);
      await token_dnft.methods.tokenURI(tokenID).call({from:address}).then(res => {
          url = res
      })
      console.log(url)

      response = await fetch(url).then(res => {
        return res.json()
      });

      data.push([response,wrapperID,tokenID,price,user,isDirect])
    }
    return data;
  }

  async function viewOwnedListings() {
    if (!connectMetaMask){
      return;
    }
    console.log(address);

    console.log('viewing owned listings')
    var listings = [];
    try {
      await Market.methods.getOwnedListings().call({from:address}).then(res => listings = res);
    } catch(error) {
      alert(error);
      return;
    }
    var data = [];
    try {
      await getListings(listings).then(res=>{
        data=res
      });
      console.log(data)
      if (data.length==0){
        setNoListingMessage('You have not listed any token.');
      } else {
        setNoListingMessage('');
      }
      setItemsList(data);
    } catch (error) {
      alert(error);
    }
  }

  async function getBids(wrapperID){
    if (!connectMetaMask){
      return;
    }

    try{
      var Bids = []
      await Market.methods.getAllBids(REACT_APP_WRAPPER_ADDRESS,wrapperID).call({from:address}).then(res=>{
        Bids=res;
      })
      var results = []
      for (let i = 0; i<Bids.length;i++){
        results.push({'rentee':Bids[i].rentee,'Price Per Day': Bids[i].pricePerDay.toNumber(),
        'Rental Duration':Bids[i].rentalDays.toNumber(),'Token ID': Bids[i].tokenId.toNumber()})
      }
      console.log(results)
      if (results.length==0) {
        setHaveBids(false);
        setBids(
        <Typography paddingLeft={3} fontSize={15}>
          No bids received yet
        </Typography>
      )
      } else {
        setHaveBids(true)
        setBids(
          <select>
            {results.map(bid=>{
            const value = `${bid['Token ID']},${bid['rentee']}`;
            return (
              <option value={value}>
                Price: {bid['Price Per Day']} wei/day; 
                Rental Duration: {bid['Rental Duration']} days
              </option>
            )
          })}
          </select>
        )
      }
    } catch(error) {
      alert(error)
    }
  }


  async function delist(wrapperID) {
    if (!connectMetaMask){
      return;
    }

    handleCloseDelist(wrapperID);
    console.log("Delisting NFT")

    //delist token
    try {
      await Market.methods.delistNFT(REACT_APP_WRAPPER_ADDRESS, wrapperID).send({from:address});
      console.log('delisted')
    } catch (error) {
      alert('Unsuccessful delisting:( Please try again a while later.');
      return;
    }

    //unwrap token
    try {
      await unwrap(wrapperID)
      console.log('unwrapped')
      alert('NFT Delisted Successfully');
    } catch (error) {
      alert(error)
    }
  }

  async function acceptBid(){
    if (!connectMetaMask){
      return;
    }

    if (!haveBids) {
      alert('There are no bids to accept. Please close the dialogue.');
      return;
    }
    const [wrapperID,rentee] = document.getElementById('selectBid').value.split(',');
    console.log(wrapperID);
    console.log(rentee);
    try {
      console.log('Connecting to the market to accept the bid ')
      await Market.methods.acceptBid(REACT_APP_WRAPPER_ADDRESS,wrapperID,rentee).send({from:address});
      console.log(`Owner accepted the bid from ${rentee} for token wrapped at ID ${wrapperID}`);
      handleClose(wrapperID);
    } catch (error) {
      alert(error);
    }
  }

  function showViewBids(item) {

    if (item[5]) {
      return <Button disabled>View Bids</Button>
    } else {
      return <Button onClick={()=>handleClickOpen(item[1])} startIcon={<GradingRoundedIcon />}>View Bids</Button>
    }
  }

  var userAuthenticated = true;
  

  if (userAuthenticated) {   
       var listItems = itemsList.map((item) =>
       <Grid item key={item[1]} xs={4}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column'}}>
          <div>{displayNFT(item)}</div>
          <Typography fontWeight='bold' fontFamily='-apple-system' fontStyle='italic' color='#23abd6' fontSize={20} paddingLeft={16}>
              Current User: 
          </Typography>
          <Typography fontWeight='bold' fontFamily='BlinkMacSystemFont' paddingLeft={8} justifyContent='center'>
            {item[4]}
          </Typography>

          <CardActions style={{justifyContent:'center', alignItems:'left',flexDirection:'column'}}>
            <ButtonGroup sx={{height:'2vw'}} variant='text'>
              {showViewBids(item)}
              <Button startIcon={<EditIcon />}> {item[3]} wei/Day </Button>
              <Button onClick={()=>handleClickOpenDelist(item[1])} fontSize='small' startIcon={<DeleteIcon />}>Delete</Button>
            </ButtonGroup>

            <Dialog open={openDelist[item[1]]} onClose={()=>handleCloseDelist(item[1])}>
              <DialogTitle id="alert-dialog-title">
                {"Are You sure to delist the token?"}
              </DialogTitle>
              <DialogContent>
                <DialogContentText id="alert-dialog-description">
                  The action is irreversible. To re-list the token, you will have to do it from scratch and pay listing fee again.
                  
                  The delisting process will take about 20 seconds. You can refresh the page in 20 seconds to see that its has been delisted.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={()=>handleCloseDelist(item[1])}>Disagree</Button>
                <Button onClick={()=>delist(item[1],item[2])} autoFocus>
                  Agree
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog open={open[item[1]]}>
              <DialogTitle variant='h5' fontSize={20} fontWeight={'light'}>
                Select a Bid to Accept
              </DialogTitle>
              <DialogContentText>
                  {bids}
              </DialogContentText>
              <DialogActions style={{flexDirection:'row',justifyContent:'space-between'}}>
                <Button onClick={()=>handleClose(item[1])}>Cancel</Button>
                <Button onClick={acceptBid} id={item[1]}>Accept Bid</Button>
              </DialogActions>
            </Dialog>

          </CardActions>
        </Card>
      </Grid>);


      return (
          <div>
              <Box  display="flex" justifyContent='flex-end' paddingRight={3} paddingBottom={5}>
              <Button variant="outlined" onClick={()=>connectMetaMask()}>MetaMask</Button>
              </Box>
              <div>
              <Container>
              <Card>
              <Box
                component="form"
                sx={{
                  '& .MuiTextField-root': { m:1, width: '25ch' },
                }}
                noValidate
                autoComplete="off"
              >
                <div>
                <Typography gutterBottom variant="h9" sx={{m:2}} component="h3">
                  List your token for rental and earn rental fees today!
                </Typography>
                <Grid container spacing={0}>
                <Grid item sm={4}>
                    <TextField
                      required
                      id="nft-address"
                      onChange={(e)=>setDnftAddress(e.target.value)}
                      fullWidth
                      label='NFT Address'
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item sm={4}>
                    <TextField
                      required
                      id="tokenid"
                      fullWidth
                      label='Token ID'
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item sm={4}>
                    <TextField
                      required
                      id="price"
                      fullWidth
                      label="Price per Day"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item sm={4}>
                    <TextField
                      required
                      id="min-days"
                      fullWidth
                      label="Min Number of Rental Days"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item sm={3}>
                    <TextField
                      required
                      id="max-days"
                      fullWidth
                      label="Max Number of Rental Days"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item sm={4} paddingLeft={13} paddingTop={1}>
                  <FormControlLabel
                    label="Require Bidding for Rental"
                    control={
                      <Checkbox
                      onClick={()=>setBidRequired(prevState => {
                        alert(!prevState);
                        return !prevState
                      })}
                      />
                    }
                  />
                  </Grid>
                  <Container sx={{ flexDirection: 'row'}}>
                  <Grid container sx={{m:0}} columns={{ xs: 4, md: 12 }} direction="row" justifyContent="flex-start" alignItems="center">
                  <Button sm ={2} sx={{m:1}} variant="contained" onClick={list}>List this NFT</Button>
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
                    <Typography>{noListingMessage}</Typography>
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
              <p></p>
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
