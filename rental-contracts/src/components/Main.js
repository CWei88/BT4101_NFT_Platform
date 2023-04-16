import * as React from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Markdown from './Markdown';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import database from '../firebase.js'
import Button from '@mui/material/Button';
import { collection, query, where, getDocs } from "firebase/firestore";

function Main(props) {
  const { title } = props;

  const [postsList,setPosts] = React.useState([]);

  async function getPosts() {
    var posts = []
    const q = query(collection(database, "Posts"));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      var data = JSON.parse(JSON.stringify(doc.data()));
      data['datetime'] = new Date(data['datetime']);
      posts.push(data);
    });
    console.log(posts)
    posts.sort(function(a,b){
      if (a['datetime']>b['datetime']){
        return -1;
      } else {
        return 1;
      }
    })
    setPosts(posts)
  }

  return (
    <Grid
      item
      xs={12}
      md={8}
      sx={{
        '& .markdown': {
          py: 3,
        },
      }}
    >
      <Grid container sx={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Button variant = 'outlined' onClick={()=>getPosts()}>Refresh Posts</Button>
      </Grid>
      <p></p>
      <Divider />
      {postsList.map((post) => (
        <div>
          
          <Box sx={{ mt: 2, typography: 'body1',flexDirection:'column' }}>

            <Grid container sx={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
              <Typography variant='h6' fontWeight={'bold'}>
                {post['title']}
              </Typography>
            </Grid>
            <p></p>
            <p></p>

            <Typography variant='body1' fontSize={18}>{post['content']}</Typography>
            <CardMedia
                component="img"
                sx={{
                    width:'20%',
                    pt: 0,
                    margin:2
                }}
                image={post['image']}
                alt="random"
                />
            <Grid container sx={{display:'flex',flexDirection:'row',justifyContent:'space-between'}}>
              <Typography variant='body2'>
                Posted by: {post['author']}
              </Typography>
              <p></p>
              <Typography variant='body1' fontStyle={'italic'}>
                  {post['datetime'].toLocaleString()}
              </Typography>
            </Grid>
          </Box>
          <Divider/>
        </div>
      ))}
    </Grid>
  );
}

Main.propTypes = {
  title: PropTypes.string.isRequired
};

export default Main;