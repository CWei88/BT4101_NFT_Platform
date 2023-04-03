import * as React from "react";
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import CardMedia from '@mui/material/CardMedia';
import Container from '@mui/material/Container';
import { doc, setDoc } from "firebase/firestore"; 
import database from '../firebase.js'

const displayAttributes = (object) => {
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
          <Card rowspacing={1} columnspacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 3, sm: 3 }} sx={{height: '80%', width:'8vw',display:'flex', flexDirection: 'column'}}>
          <CardContent sx={{backgroundColor:'#64b5f6',paddingTop:0.5,paddingBottom:1,paddingLeft:1,paddingRight:1}}>
          <Typography variant ='h6' fontFamily={'"Apple Color Emoji"'} fontSize={15} fontWeight={900} color={'white'}>
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

function imageURL(item) {
    const rawURL = item['image'];
    const readyURL = rawURL.replace("ipfs://", "https://ipfs.io/ipfs/");
    return readyURL;
}

const displayNFT = (item) => {
    return (
        <div>
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
        </div>
    )
}

async function writePostData(_author,_title,_content,_datetime,_image) {
  await setDoc(doc(database, 'Posts', _author+' '+_title), {
    author:_author,
    title:_title,
    content:_content,
    datetime:_datetime,
    image:_image
  });
}

async function writeUserData(username,password) {
  await setDoc(doc(database, 'Accounts', username), {
    username: username,
    password: password
  });
}

export {displayAttributes,displayNFT,writePostData, writeUserData};