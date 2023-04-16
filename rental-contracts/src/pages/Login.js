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
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { connectWallet } from '../components/WalletLogin.js';
import Blog from './Blogs.js';
import Signup from './Signup.js'

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

    const [username,setUsername] = React.useState('');
    //const [preLogin,setPreLogin] = React.useState(true);
    //const [postLogin,setPostLogin] = React.useState(false);

    const [preShow,setPreShow] = React.useState(true);
    const [postShow,setPostShow] = React.useState(false);


    const Account = () => {

        const [name, setName] = React.useState('');
        const [code,setCode] = React.useState('');
        //const [greeting,setGreeting] = React.useState('Not Logged In Yet')
        const [warnShow,setWarnShow] = React.useState(false);
        const [notFoundShow,setNotFoundShow] = React.useState(false);


        const handleSubmit = (event) => {
            event.preventDefault();
            //const data = new FormData(event.currentTarget);
            console.log({
            username: name,
            password: code
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
                                    <Grid item>
                                        <Link href="/signup" variant="body2">
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

            if (name == '' || code == '') {
                console.log('null inputs:');
                setWarnShow(true);
            } else if (name != '' && code != '') {
                console.log('Not null')
                var userFound = false;
                await checkUser(name,code).then(res=>{
                    userFound=res;
                });
                console.log('user found: ', userFound);
                if (userFound) {
                    setUsername(name);
                    setPreShow(prevState => !prevState);
                    setPostShow(prevState => !prevState);
                } else {
                    setNotFoundShow(prevState => !prevState);
                }
            }
        }

        async function checkUser(user,password){
            const ref = doc(database, "Accounts", user)
            const docSnap = await getDoc(ref);

            var success = false;

            if (docSnap.exists()) {
                console.log("Document data:", docSnap.data().username);
                if (docSnap.data().password === password) {
                    success = true;
                    console.log('success: ', success);
                }
            }

            console.log('final success status: ',success);
            return success;
        }

    };

    return (
        <div>
          {preShow && <Account />}
          {postShow && <Blog username={username} />}
        </div>
    )
}


export {Login};



