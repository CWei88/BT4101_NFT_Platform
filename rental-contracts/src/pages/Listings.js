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
import { connectWallet } from '../components/WalletLogin.js';
import {displayNFT} from '../components/Functions.js'

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

const Listings=()=>{

  //View Bids Dialog
  const [itemsList, setItemsList] = useState([]);
  const [listMessage,setListMessage] = useState('');
  const [openDelist, setOpenDelist] = useState({});
  const [open, setOpen] = useState({});
  const [bids,setBids] = useState([]);
  const [haveBids,setHaveBids] = useState(false);
  const [noListingMessage,setNoListingMessage] = useState(false);

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

  async function wrap(id) {
    //original token approve wrapper contract
    try {
      const txApprove  = await token_dnft.approve(REACT_APP_WRAPPER_ADDRESS,id);
      const receiptApprove = await txApprove.wait();
      console.log('Wrapper Contract Approved')
      setListMessage('Loading: Wrapper Contract Approved...')
    } catch (error) {
      alert(error);
      return -1;
    }

    //Check owner and wrap token
    //await token_dnft.ownerOf(id).then(res => {
      //setListMessage(`Loading: Verifying token owner: ${res}`)
      //console.log(`Loading: Verifying token owner: ${res}`)
    //});
    setListMessage('Loading: Wrapping Token')
    var wrapperID = -1;
    try {
      const wrap = await Wrapper.wrapToken(REACT_APP_DNFT_ADDRESS,id,{'gasPrice':10000000000,'gasLimit':250000})
      const wTx = await wrap.wait();
      wrapperID = wTx.events[2].args[1].toNumber();


      await token_dnft.ownerOf(id).then(res => {
        setListMessage(`Loading: Current owner becomes: ${res}`)
        console.log(`Loading: Current owner becomes: ${res}`)
        console.log('wrapped')
        setListMessage('Loading: Token wrapped')
      });
    } catch (error) {
      console.log(error);
      alert(error);
    }
    //console.log(wTx.events)
    //print out wrapper address
    //let newAddress = wTx.events[2].address.toString();
    //console.log(`NFT of tokenId ${id} wrapped at address ${newAddress}`)
    //setListMessage(`LoadingL NFT of tokenId ${id} wrapped at address ${newAddress}...`)
    return wrapperID;
   }

   async function unwrap(wrapperID){
    const unwrap = await Wrapper.unwrapToken(wrapperID)
    const wTx = await unwrap.wait();
    console.log("Token unwrapped")

    let newAddress = wTx.events[2].address.toString();

    console.log(`NFT of wrapperId ${wrapperID} unwrapped at address ${newAddress}`)
   }

  async function list() {
    const listingDuration = 1

    const tokenId = document.getElementById('tokenid').value
    console.log(tokenId)
    const price = document.getElementById('price').value
    const minDays = document.getElementById('min-days').value
    const maxDays = document.getElementById('max-days').value
    const tokenAddress = document.getElementById('nft-address').value

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
      let approval = await Wrapper.approve(REACT_APP_MARKET_ADDRESS, wrapperID)
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
      await Wrapper.ownerOf(wrapperID).then(res => console.log(res))
      let listTx = await Market.listNFT(REACT_APP_WRAPPER_ADDRESS, wrapperID, price,minDays,maxDays, expiryTime,{value:1});
      await listTx.wait()
      console.log("NFT Listed")
      await Wrapper.ownerOf(wrapperID).then(res => console.log(`Wrapper token owner now becomes: ${res}`))

      //window.setTimeout(delist(REACT_APP_WRAPPER_ADDRESS,1),24*60*60*60*1000)
      setListMessage(`Congrats, NFT has been listed successfully! Your listing will expire at ${new Date(expiryTime*1000)}`)
    } catch(error) {
      alert(error)
      return;
    }
  }

  async function getListings(listings){
    console.log(listings)
    var data = []
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
      var user = 'None';
      await Wrapper.userOf(wrapperID).then(res=> {
        if (res != '0x0000000000000000000000000000000000000000'){
          user = `${res.substring(0,10)}...${res.substring(30)}`;
        } else {
          user = 'The token has not been rented out'
        }
      })
      var url = ''
      var response = ''
      var price = parseInt(listings[i]['pricePerDay'])
      console.log(price)
      await token_dnft.tokenURI(tokenID).then(res => {
          url = res
      })
      console.log(url)

      response = await fetch(url).then(res => {
        return res.json()
      });

      data.push([response,wrapperID,tokenID,price,user])
    }
    return data;
  }

  async function viewOwnedListings() {
    connectWallet();

    console.log('viewing owned listings')
    var listings = [];
    try {
      await Market.getOwnedListings({gasLimit: 1000000}).then(result => {
        listings=result
      })
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
    try{
      var Bids = []
      await Market.getAllBids(REACT_APP_WRAPPER_ADDRESS,wrapperID).then(res=>{
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


  async function delist(wrapperID,tokenID) {
    handleCloseDelist(wrapperID);
    console.log("Delisting NFT")

    //delist token
    try {
      await Wrapper.getOwner(REACT_APP_DNFT_ADDRESS,tokenID).then(res=>console.log(`Owner: ${res}`))
      let delistTx = await Market.delistNFT(REACT_APP_WRAPPER_ADDRESS, wrapperID)
      await delistTx.wait()
      await Wrapper.getOwner(REACT_APP_DNFT_ADDRESS,tokenID).then(res=>console.log(`Owner now becomes: ${res}`))
      console.log('delisted')
    } catch (error) {
      alert(error);
      return;
    }

    //unwrap token
    try {
      await unwrap(wrapperID)
      console.log('unwrapped')
      //console.log(`NFT ${id} delisted`)
    } catch (error) {
      alert(error)
    }

    try{
      const claim = await Market.claimNFT(REACT_APP_WRAPPER_ADDRESS,wrapperID);
      await claim.wait();
      console.log('NFT claimed back to owner');
      await token_dnft.ownerOf(wrapperID).then(res => {
        console.log(`Current owner becomes: ${res}`)
        console.log('completed')
      });
      alert('NFT Delisted Successfully');
    } catch (error) {
      alert(error);
    }
  }

  async function acceptBid(){
    if (!haveBids) {
      alert('There are no bids to accept. Please close the dialogue.');
      return;
    }
    const [wrapperID,rentee] = document.getElementById('selectBid').value.split(',');
    console.log(wrapperID);
    console.log(rentee);
    try {
      console.log('Connecting to the market to accept the bid ')
      const tx = await Market.acceptBid(REACT_APP_WRAPPER_ADDRESS,wrapperID,rentee);
      tx.wait();
      console.log(`Owner accepted the bid from ${rentee} for token wrapped at ID ${wrapperID}`);
      handleClose(wrapperID);
    } catch (error) {
      alert(error);
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
              <Button onClick={()=>handleClickOpen(item[1])} startIcon={<GradingRoundedIcon />}>View Bids</Button>
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
