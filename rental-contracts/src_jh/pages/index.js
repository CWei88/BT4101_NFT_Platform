import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import {Link} from '@mui/material';
import Box from '@mui/material/Box';
import { createTheme} from '@mui/material/styles';
import './index.css';


const theme = createTheme();

const Home = () => {
  return (
    <div>
    <h1> Welcome to NFT Rental Platform</h1>

    <Paper
      sx={{
        position: 'relative',
        backgroundColor: 'grey.800',
        color: '#fff',
        mb: 4,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        //backgroundImage: 'https://pixelplex.io/wp-content/uploads/2022/02/how-to-create-an-nft-marketplace-main-1600-1.jpg',
      }}
    >
      {/* Increase the priority of the hero background image */}
      {<img src='https://pixelplex.io/wp-content/uploads/2022/02/how-to-create-an-nft-marketplace-main-1600-1.jpg' alt='imageText' />}
      <Grid container>
        <Grid item md={6}>
          <Box
            sx={{
              position: 'center',
              p: { xs: 20, md: 5 },
              pr: { md: 1 },
              width: 1100,
              height: 200,
            }}
          >
            <div className='text'>
              <Typography variant="h3" color="inherit" sx={{pl:20,mt:5}}>
                Start Your NFT Journey Today at Low Cost
              </Typography>
              <Typography variant="h3" color="inherit" align="right">
                
              </Typography>
              <Link variant="h5" align="center" sx={{pl: 60, pt:50}} href="/rent">
              Click here to start renting
              </Link>
            </div>
          </Box>
        </Grid>
      </Grid>
    </Paper>
    </div>
  );
};
  
export default Home;