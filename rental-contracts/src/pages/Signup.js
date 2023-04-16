import database from '../firebase.js'
import {doc, getDoc} from "firebase/firestore"; 
import React from "react";
import './Login.css'
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {Link} from '@mui/material';
import Box from '@mui/material/Box';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { connectWallet } from '../components/WalletLogin.js';
import Blog from './Blogs.js';
import {writeUserData} from '../components/Functions.js'

function Copyright(props) {
    return (
      <Typography variant="body2" color="text.secondary" align="center" {...props}>
        {'Copyright © '}
        <Link color="inherit" href="https://mui.com/">
          FashRent
        </Link>{' '}
        {new Date().getFullYear()}
        {'.'}
      </Typography>
    );
}
const theme = createTheme();

const Signup = () => {

    const [name, setName] = React.useState('');
    const [code,setCode] = React.useState('');
    //const [greeting,setGreeting] = React.useState('Not Logged In Yet')


    const handleSubmit = (event) => {
        event.preventDefault();
    };

    return (
        <ThemeProvider theme={theme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                    <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                    >
                        <Avatar sx={{ m: 1, bgcolor: '#ed9918' }}>
                            <PersonAddAltIcon />
                        </Avatar>
                        <Typography component="h1" variant="h5">
                            Register
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                            <TextField
                            margin="normal"
                            required
                            fullWidth
                            id="username"
                            label="Username"
                            onChange={e=>setName(e.target.value)}
                            name="username"
                            autoFocus
                        />
                            <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            onChange={c=>setCode(c.target.value)}
                            label="Password"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            />
                            <FormControlLabel
                            control={<Checkbox value="remember" color="primary" />}
                            label="Remember me"
                            />
                            <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            onClick={collect}
                            >
                                Sign Up
                            </Button>
                        </Box>
                    </Box>
                <Copyright sx={{ mt: 8, mb: 4 }} />
            </Container>
        </ThemeProvider>
        
    );
    async function collect() {
        console.log('collect() invoked')

        //warning = document.getElementById('warning');
        //pre_login = document.getElementById('pre-login')

        //const post_login = ref_post.current;

        console.log('username', name)
        console.log('password', code)

        if (name == '' || code == '') {
            console.log('null inputs:');
            alert('Username and password must not be empty');
        } else if (name != null && code != null) {
            console.log('Not null')
            await checkUser(name,code);
        }
    }

    async function checkUser(user,password){
        const ref = doc(database, "Accounts", user)
        const docSnap = await getDoc(ref);

        if (docSnap.exists()) {
            alert('The username already exists.');
        } else {
            try{
                await writeUserData(user,password);
                alert('You have registered successfully! Press the login button again to log in to your account')
            } catch (error) {
                alert(error);
            }
        }
    }

};

export default Signup;