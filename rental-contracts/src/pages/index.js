import React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import {Link} from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import { createTheme} from '@mui/material/styles';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import './index.css';


const theme = createTheme();

const Home = () => {
  return (
    <div>
      <Container maxWidth="lg">
          <Card sx={{height: '80%'}}>
                <CardMedia
                    component="img"
                    sx={{
                        width:'100%',
                        pt: 0
                    }}
                    image='https://pixelplex.io/wp-content/uploads/2022/02/how-to-create-an-nft-marketplace-main-1600-1.jpg'
                    alt="random"
                    />
            <div class="container">
              <div class='center'>
                  <Typography variant="h3" fontStyle={'italic'} fontSize={20} color="inherit" sx={{ position: 'absolute',top:'100px', left: '100px'}}>
                    Start Your NFT Journey Today at Low Cost
                  </Typography>
                  <p></p>
                </div>
            </div>
          </Card>
        </Container>
        <p></p>
      </div>
  );
};
  
export default Home;