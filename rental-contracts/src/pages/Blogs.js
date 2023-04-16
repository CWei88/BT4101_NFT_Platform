import * as React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import GitHubIcon from '@mui/icons-material/GitHub';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import MainFeaturedPost from '../components/MainFeaturedPost';
import Main from '../components/Main';
import Sidebar from '../components/Sidebar';
import PostField from '../components/PostField.js'
import PropTypes from 'prop-types';


const theme = createTheme();

function Blog(props) {
  const {username} = props;

  const mainFeaturedPost = {
    title: 'Just got my hands on the newest release of #Seizon series!',
    content:
      "I am so excited! I have always loved this quirky bobblehead design!",
    image: 'https://i.seadn.io/gcs/files/0b3ee4b7684fd76c62f75d5079e94734.gif?auto=format&w=750',
  };

  const sidebar = {
    title: 'About FashRent & NFT Rarity',
    description:
      'Each precious NFT comes with its unique traits. We want owners and everyone to appreciate the value of every token. Do not hesitate to show off your NFTs by posting them! You can also see whose NFTs are the rariest on average!',
    social: [
      { name: 'GitHub', icon: GitHubIcon },
      { name: 'Twitter', icon: TwitterIcon },
      { name: 'Facebook', icon: FacebookIcon },
    ],
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <main>
          <PostField username={username}></PostField>
          <MainFeaturedPost post={mainFeaturedPost} />
          <Grid container spacing={5} sx={{ mt: 3 }}>
            <Main title="Newest Posts"/>
            <Sidebar
              title={sidebar.title}
              description={sidebar.description}
              social={sidebar.social}
            />
          </Grid>
        </main>
      </Container>
    </ThemeProvider>
  );
}
Blog.propTypes = {
  username: PropTypes.string.isRequired
};

export default Blog;

