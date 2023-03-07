import React from "react";
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const {ethers} = require('hardhat');

async function Listings(){
    var userName='junhan';
    var userAuthenticated = true;

    const [items,setItem] = React.useState([]);
    var itemsList = []

    async function rent() {
      console.log("Getting token for rent");
      const contractAddress = '0x0E99b6eEAF4777b8D3b9A6dEd29a363df43adED3'
      const token = await ethers.getContractAtFromArtifact("RentableNFT", contractAddress)
      const owner = '0xdC3A74E97F3D40Ebd0Ec64b9b01128b6E200969C'
  
      const renter = '0xD172885233efaa6Ce7018c0718D12550a2991196'
      const tokenId = '2'
      const expiry = Math.round(new Date().getTime() / 1000) + 600
      let tx = await token.rent(tokenId, renter, expiry)
      await tx.wait();
  
      console.log(`NFT ${tokenId} rented to ${renter} until ${expiry}`)
      console.log(tx.hash)
  }

    if (userAuthenticated) {    

        var listItems = items.map((it) =>
            <Grid item key={it.name} xs={4}>
                <Card
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <CardMedia
                    component="img"
                    sx={{
                      // 16:9
                      pt: 0,
                      height: 200
                    }}
                    image={it.image}
                    alt="random"
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      {it.name}
                    </Typography>
                    <Typography>
                      Description: {it.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                  <IconButton aria-label="edit" size='large'
                  style={{
                          display: 'flex',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                      }}>
                      <EditIcon fontsize='large'/>
                    </IconButton>
                    <IconButton aria-label="delete" size='large'
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                    }}>
                      <DeleteIcon fontsize='large'/>
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>);


        return (
            <div>
                <h1>
                    Manage Your Listings
                </h1>
                <div>
                <Container sx={{ flexDirection: 'row'}}>
                    <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 4, md: 12 }} direction="row" justifyContent="space-evenly" alignItems="center">
                        {listItems}
                    </Grid>
                </Container>
                </div>

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
