import * as React from 'react';
import { TextField } from '@mui/material';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CardMedia from '@mui/material/CardMedia';
import jsonMarketData from '../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json';
import jsonDiffNFTData from '../artifacts/contracts/DiffTypeNFT.sol/DiffTypeNFT.json';
import jsonWrapperData from '../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json'
import {ethers} from 'ethers';
import { writePostData } from '../components/Functions';

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

function PostField() {
    const [itemsList,setItemsList] = React.useState([])
    const [imageSrc,setImageSrc] = React.useState('');
    const [borderColors,setBorderColors] = React.useState({});
    const [title,setTitle] = React.useState('');
    const [content,setContent] = React.useState('');

    function changeBorder(wrapperID){
        var curColors = JSON.parse(JSON.stringify(borderColors));
        curColors[wrapperID]=4
        for (let id in curColors) {
            if (id!=wrapperID){
                curColors[id]=0;
            }
        }
        setBorderColors(curColors);
    }

    async function viewOwnedListings() {
        var listings = [];
        await Market.getOwnedListings({gasLimit: 1000000}).then(result => {
          listings=result
        })
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
            var url = ''
            var response = ''
            await token_dnft.tokenURI(tokenID).then(res => {
                url = res
            })
            console.log(url)

            response = await fetch(url).then(res => {
                return res.json()
            });
            data.push([response,wrapperID])
        }
        console.log(data)
        setItemsList(data);
    }

    function imageURL(item) {
        if (item != undefined) {
            const rawURL = item['image'];
            const readyURL = rawURL.replace("ipfs://", "https://ipfs.io/ipfs/");
            return readyURL;
        }
    }
    function selectNFT(url,wrapperID){
        console.log(wrapperID);
        changeBorder(wrapperID);
        setImageSrc(url);
        console.log(imageSrc);
    }

    async function post(){
        if (title==''){
            alert('Post title is necessary');
            return;
        } else if (content==''){
            alert('Post content is necessary');
            return;
        }

        const author = 'junhan';
        const curDatetime = new Date().toLocaleString();
        await writePostData(author,title,content,curDatetime,imageSrc);
        alert('Cool! We got your post!');
        setImageSrc('');
    }

    var nftImages = itemsList.map((item) => {
        return (
        <Grid item key = {item[1]}>
            <Box>
            <CardMedia
                onClick={()=>selectNFT(imageURL(item[0]),item[1])}
                border={borderColors[item[1]]}
                component="img"
                sx={{
                    width:'40%',
                    pt: 0,
                    margin:5
                }}
                image={imageURL(item[0])}
                alt="random"
                />
            </Box>
        </Grid>
        )
    });
  
    return (
    <Container maxWidth="lg">
        <Card>
            <Box
            component="form"
            sx={{
                '& .MuiTextField-root': { m: 3, width: '40ch' },
            }}
            noValidate
            autoComplete="off"
            >
                <Grid container sx={{flexDirection:'row'}}>
                    <Grid item sx={{md:12}}>
                    <Typography variant='h6' paddingLeft={3} paddingTop={3} >Post Title</Typography>
                    <TextField
                        required
                        id="title"
                        label='Post Title'
                        variant="outlined"
                        onChange={(e)=>setTitle(e.target.value)}
                    />
                    </Grid>
                    <Grid>
                    <Typography variant='h6' paddingLeft={3} paddingTop={3}>Post Content</Typography>
                    <TextField
                        required
                        id="content"
                        label='Post Content'
                        variant="outlined"
                        multiline
                        onChange={(e)=>setContent(e.target.value)}
                    />
                    </Grid>
                </Grid>
                <Grid paddingLeft={3} paddingRight={3}>
                    <Button variant='contained' onClick = {()=>viewOwnedListings()}>Include Your NFTs</Button>
                    <p></p>
                    <Card sx={{flexDirection:'row', display:"flex"}}>
                        {nftImages}
                    </Card>
                </Grid>
                <Box
                m={1}
                //margin
                display="flex"
                justifyContent="flex-end"
                alignItems="flex-end"
                paddingRight={10}>
                    <Button display="flex"  onClick={()=>post()} variant='outlined'>Post</Button>
                </Box>
            </Box>
         </Card>
      </Container>
    );
  }
  
  export default PostField;