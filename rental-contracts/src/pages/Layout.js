import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import {Link} from '@mui/material';
import {Outlet} from 'react-router-dom';
import {connectWallet} from '../components/WalletLogin.js'


const Layout = () => {
    return (
        <div>
        <AppBar
            position="static"
            color="default"
            elevation={0}
            sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
            >
            <Toolbar sx={{ flexWrap: 'wrap' }}>
                <Typography variant="h5" color="inherit" noWrap sx={{ flexGrow: 1, fontStyle: 'italic', fontFamily: "Raleway" }}>
                    FashRent
                </Typography>
                <nav>
                    <Link
                    variant="button"
                    color="text.primary"
                    href="/"
                    sx={{ my: 1, mx: 1.5 }}
                    >
                    Home
                    </Link>
                    <Link
                    variant="button"
                    color="text.primary"
                    href="/listings"
                    sx={{ my: 1, mx: 1.5 }}
                    >
                    My Listings
                    </Link>
                    <Link
                    variant="button"
                    color="text.primary"
                    href="/rent"
                    sx={{ my: 1, mx: 1.5 }}
                    >
                    Market
                    </Link>
                    <Link
                    variant="button"
                    color="text.primary"
                    href="/blog"
                    sx={{ my: 1, mx: 1.5 }}
                    >
                    Blogs
                    </Link>
                    <Button href="/login" variant="outlined" sx={{ my: 1, mx: 1.5 }}>
                        Login
                    </Button>

                </nav>
            </Toolbar>
        </AppBar>
        <p></p>
        <Outlet />
        </div>
    );
};

export default Layout;
