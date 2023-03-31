import database from '../firebase.js'
import React from "react";
import './Login.css'
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import {Link} from '@mui/material';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { connectWallet } from '../components/WalletLogin.js';

console.log('css imported')

var userAuthenticated = false;
var userName = null;


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
const Login = () =>  {

    let username = null;
    let password = null;

    //const [preLogin,setPreLogin] = React.useState(true);
    //const [postLogin,setPostLogin] = React.useState(false);

    const [preShow,setPreShow] = React.useState(true);
    const [postShow,setPostShow] = React.useState(false);


    const Account = () => {

        const [name, setName] = React.useState('username not entered');
        const [code,setCode] = React.useState('password not entered');
        //const [greeting,setGreeting] = React.useState('Not Logged In Yet')
        const [warnShow,setWarnShow] = React.useState(false);
        const [notFoundShow,setNotFoundShow] = React.useState(false);


        const handleSubmit = (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            console.log({
            email: data.get('username'),
            password: data.get('password'),
            });
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
                <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
                    <LockOutlinedIcon />
                </Avatar>
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>
                {warnShow && 
                    <p id='warning'>Please enter your username and password to continue</p>
                }
                {notFoundShow &&
                    <p id='notFound'>Your username or password is wrong.</p>
                }
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
                    Sign In
                    </Button>
                    <Grid container>
                    <Grid item xs>
                        <Link href="#" variant="body2">
                        Forgot password?
                        </Link>
                    </Grid>
                    <Grid item>
                        <Link href="#" variant="body2">
                        {"Don't have an account? Sign Up"}
                        </Link>
                    </Grid>
                    </Grid>
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

            if (name == null || code == null) {
                console.log('null inputs:');
                setWarnShow(true);
            } else if (name != null && code != null) {
                console.log('Not null:')
                var userFound = checkUser(name,code);
                console.log('user found: ', userFound);
                if (userFound) {
                    username = name;
                    password = code;
                    setPreShow(false);
                    setPostShow(true);
                    console.log('username set to be ' + username);
                    console.log('password set to be ' + password);
                    userAuthenticated = true;
                    userName = username;
                }
            }
            console.log('authenticated ', userAuthenticated)
        }

        async function checkUser(user,password){
            var docRef = database.collection("Accounts").doc(user);

            var success = false;

            await docRef.get().then((doc) => {
                if (doc.exists) {
                    console.log("Document data:", doc.data().username);
                    if (doc.data().password === password) {
                        //setGreeting('Hello ' + user);
                        success = true;
                        console.log('success: ', success);
                    } else {
                        console.log('Password Incorrect');
                        setNotFoundShow(prevState => !prevState);
                    }
                } else {
                    // doc.data() will be undefined in this case
                    console.log("User Not Found!");
                    setNotFoundShow(prevState => !prevState);
                }
            }).catch((error) => {
                console.log("Error getting document:", error);
            });

            console.log('final success: ',success);
            return success;
        }

    };

    return (
        <div>
        {preShow && <Account />}
        {postShow && <p>You are logged in.</p>}
        </div>
    )
}


export {Login};



