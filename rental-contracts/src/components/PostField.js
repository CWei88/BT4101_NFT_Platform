import * as React from 'react';
import { TextField } from '@mui/material';
import PropTypes from 'prop-types';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import jsonMarketData from '../artifacts/contracts/MarketplaceDC.sol/MarketplaceDC.json';
import jsonNFTData from '../artifacts/contracts/RentableNFT.sol/RentableNFT.json';
import jsonDiffNFTData from '../artifacts/contracts/DiffTypeNFT.sol/DiffTypeNFT.json';
import jsonWrapperData from '../artifacts/contracts/ERC4907/ERC4907Wrapper.sol/ERC4907Wrapper.json'
import {ethers} from 'ethers';

const {REACT_APP_PRIVATE_KEY} = process.env
const REACT_APP_MARKET_ADDRESS = "0xaA46f05c13de12e3E8B19523b7Fb0DcaD0DA74D3"
const REACT_APP_DNFT_ADDRESS = '0x1bD38a2295a409b4413a61A4202afbb1fe0A4542'
const REACT_APP_WRAPPER_ADDRESS = "0xC9199480357e2a14DF11e289A023ceBbb956E010"

const owner_private = REACT_APP_PRIVATE_KEY
const provider = ((window.ethereum != null) ? new ethers.providers.Web3Provider(window.ethereum) : ethers.providers.getDefaultProvider());
let signer = new ethers.Wallet(owner_private,provider);


const Market = new ethers.Contract(REACT_APP_MARKET_ADDRESS,jsonMarketData.abi,signer);
const token_dnft = new ethers.Contract(REACT_APP_DNFT_ADDRESS,jsonDiffNFTData.abi,signer);
const Wrapper= new ethers.Contract(REACT_APP_WRAPPER_ADDRESS,jsonWrapperData.abi,signer);

function FeaturedPost(props) {
    //const { post } = props;
    const [itemsList,setItemsList] = React.useState([])
    const [imageSrc,setImageSrc] = React.useState('')

    var listItems = itemsList.map((item) =>
        <option>{item['name']}</option>
    )

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
            await token_dnft.tokenURI(id).then(res => {
                url = res
            })
            console.log(url)

            response = await fetch(url).then(res => {
                return res.json()
            });
            data.push(response)
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

    function ShowNFTImage() {
        const NFTname = document.querySelector('#myList')
        var resItem = '';
        for (const item in itemsList){
            if (item['name'] == NFTname) {
                resItem = item;
                break;
            }
        }
        if (resItem != ''){
            setImageSrc(imageURL(resItem));
        }
    }
  
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
                    <Typography variant='body1'>Post Title</Typography>
                    <TextField
                        required
                        id="title"
                        fullWidth
                        label='Post Title'
                        variant="outlined"
                    />
                    </Grid>
                    <Grid>
                    <Typography variant='body1'>Post Content</Typography>
                    <TextField
                        required
                        id="content"
                        fullWidth
                        label='Post Content'
                        variant="outlined"
                        multiline
                        rows={4}
                    />
                    </Grid>
                    <Grid>
                        <Button variant='outlined' onClick = {viewOwnedListings}>Include Your NFTs</Button>
                        <form>  
                            <select id = "myList" onChange={ShowNFTImage()}>
                                {listItems}
                            </select> 
                        </form> 
                        <img src={imageSrc}></img> 
                    </Grid>
                </Grid>
            </Box>
         </Card>
      </Container>
    );
  }
  
  FeaturedPost.propTypes = {
    post: PropTypes.shape({
      date: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      image: PropTypes.string.isRequired,
      imageLabel: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
    }).isRequired,
  };
  
  export default FeaturedPost;