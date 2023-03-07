import React from 'react';
import database from '../firebase.js';
import {collection, getDocs } from 'firebase/firestore/lite';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

const Rent = () => {

  const itemsList = []

  async function getNFT(db) {
    const docsRef = collection(db,'AvailableNFTs');
    const docsSnapshot = await getDocs(docsRef);
    docsSnapshot.docs.forEach(doc=>
      itemsList.push(doc.data())
    );
  }

  getNFT(database);

  var listItems = itemsList.map((it) =>
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
            <Button variant="outlined">Rent</Button>
            </CardActions>
          </Card>
        </Grid>);

  return (
      <div>
          <div>
          <Container sx={{ flexDirection: 'row'}}>
              <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 4, md: 12 }} direction="row" justifyContent="space-evenly" alignItems="center">
                  {listItems}
              </Grid>
              <Popup trigger={<button> Trigger</button>} position="right center">
                <div>Popup content here !!</div>
              </Popup>
          </Container>
          </div>

      </div>
  );
};
  
export default Rent;