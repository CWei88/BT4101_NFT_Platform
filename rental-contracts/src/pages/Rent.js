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
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import {displayNFT} from '../components/Functions';

import { extractListingData, sendBiddingRequest,fetchListings, sendRentalRequest, getMetaMaskAddress } from '../components/BlockchainFunc';

const Rent = () => {
  const [open, setOpen] = useState({});
  const [openDirect, setOpenDirect] = useState({});
  const [rentalDays, setRentalDays] = useState(0);
  const [pricePerDay, setPricePerDay] = useState(0);
  const [address, setAddress] = useState('unconnected');
  const [sectionsList, setSectionsList] = useState([])

  const handleClickOpen = (wrapperID,isDirect) => {
    if (isDirect){
      var openStatus = JSON.parse(JSON.stringify(openDirect));
      openStatus[wrapperID]=true;
      setOpenDirect(openStatus);
    } else {
      var openStatus = JSON.parse(JSON.stringify(open));
      openStatus[wrapperID]=true;
      setOpen(openStatus);
    }
  };

  const handleClose = (wrapperID,isDirect) => {
    if (isDirect){
      var openStatus = JSON.parse(JSON.stringify(openDirect));
      openStatus[wrapperID]=false;
      setOpenDirect(openStatus);
    } else {
      var openStatus = JSON.parse(JSON.stringify(open));
      openStatus[wrapperID]=false;
      setOpen(openStatus);
    }
  };

  async function connectMetaMask() {
    if (address == 'unconnected') {
      alert('Press MetaMask button to connect again')
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


  async function biddingConfirmed(wrapperID){
    if (!connectMetaMask){
      return;
    }

    if (rentalDays<=0){
      alert('You must rent for at least 1 day')
    } else {
      try {
        await sendBiddingRequest(wrapperID,rentalDays,pricePerDay,address);
        alert('Bidding Submitted Successfully!');

        var openStatus = JSON.parse(JSON.stringify(open));
        openStatus[wrapperID]=false;
        setOpen(openStatus);
        setRentalDays(0);
        setPricePerDay(0);

      } catch(error) {
        alert(error.message.split('"')[3])
      }
    }
  }

  async function directRent(wrapperID) {
    if (!connectMetaMask){
      return;
    }

    if (rentalDays<=0){
      alert('You must rent for at least 1 day')
    } else {
      try {
        await sendRentalRequest(wrapperID, rentalDays,pricePerDay,address);
        let expiryTime = Math.round(new Date().getTime() / 1000) + (rentalDays*24*60*60)

        var openStatus = JSON.parse(JSON.stringify(openDirect));
        openStatus[wrapperID]=false;
        setOpenDirect(openStatus);

        setRentalDays(0);
        setPricePerDay(0);

        alert(`Congrats, your rental starts now. It will expire at ${expiryTime}`);
      } catch(error) {
        alert(error.message)
        console.log(error)
      }
    }
  }


  async function viewListings() {
    if (!connectMetaMask){
      return;
    }

    var listings = [];
    await fetchListings().then(result => {
      listings = result;
    })
    console.log(listings)

    var data = {}
    var openStatus = {}
    for (let i = 0; i < listings.length; i++) {
      var available = listings[i]['availableToRent']
      var wrapperID = parseInt(listings[i]['tokenId'])

      openStatus[wrapperID] = false;

      if (!available) {
        continue;
      }

      await extractListingData(listings[i],address).then(res=>{
        var response = res[0]
        var series = response['series']
        if (series in data){
          data[series].push(res);
        } else {
          data[series]=[];
          data[series].push(res)
        }
      });
    }
    console.log(data);
    var sections = [];
    const sectionNames = Object.keys(data)
    sectionNames.forEach(section=>{
      console.log(section)
      sections.push([section,data[section]])
    })
    console.log(sections)
    setSectionsList(sections);
    setOpen(openStatus);
  }

  function getCurrentSection(items){
    var listItems = items.map((item) =>
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
                      <Button variant='outlined' endIcon = {<AddCircleRoundedIcon />} onClick={() => handleClickOpen(item[1],item[5])}>
                      {item[2]} wei / Day
                      </Button>
                    </Grid>

                    <Dialog open={open[item[1]]} onClose={() => handleClose(item[1],item[5])}>
                    <DialogTitle fontWeight={'bold'}>Bid for {item[0]['name']}</DialogTitle>
                    <DialogContent>
                      <DialogContentText fontStyle={'italic'}>
                      To rent this NFT, you will have to bid for it. The token owner will be given 24 hours to respond to your bid.
                        If your bid is accepted, the rental will be started upon acceptance of the bid.
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
                            <Button onClick={() => handleClose(item[1],item[5])}>Cancel</Button>
                            <Button onClick={() => biddingConfirmed(item[1])}>Confirm</Button>
                          </CardActions>
                    </DialogContent>
                  </Dialog>
                  

                  <Dialog open={openDirect[item[1]]} onClose={() => handleClose(item[1],item[5])}>
                    <DialogTitle fontWeight={'bold'}>Rent {item[0]['name']} from {item[3]}</DialogTitle>
                    <DialogContent>
                      <DialogContentText fontStyle={'italic'}>
                      The rental will be started upon successful submission of the bid.
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
                            <Button onClick={() => handleClose(item[1],item[5])}>Cancel</Button>
                            <Button onClick={() => directRent(item[1])}>Confirm</Button>
                          </CardActions>
                    </DialogContent>
                  </Dialog>

            </CardActions>
        </Card>
      </Grid>);

    console.log(listItems);
    return listItems;
  }

  var userAuthenticated = true;
  

  if (userAuthenticated) { 
    var listSections = sectionsList.map((section)=>{
      return (
      <Grid item key={section[0]}>
        <Card sx={{ flexDirection: 'row'}}>
          <CardContent>
            <Typography paddingLeft={5} variant="h5" fontStyle={"italic"} fontWeight="bold">Series: {section[0]}</Typography>
          </CardContent>
          <Container>
            <Grid container rowspacing={10} columnspacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 4, md: 12 }} direction="flex" justifyContent="space-evenly" alignItems="center">
                {getCurrentSection(section[1])}
            </Grid>
        </Container>
        </Card>
      </Grid>)
    })

      return (
          <div>
              <Box  display="flex" justifyContent='flex-end' paddingRight={3} paddingBottom={5}>
                <Button variant="outlined" onClick={()=>connectMetaMask()}>MetaMask</Button>
              </Box>
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
              <Container sx={{ display:"flex",flexDirection: 'column'}}>
                  <Grid container columns={{ xs: 4, md: 12 }} direction="flex" justifyContent="space-evenly" alignItems="center">
                      {listSections}
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