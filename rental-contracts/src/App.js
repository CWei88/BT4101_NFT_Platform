import React from 'react';
import './App.css';
//import WalletCard from './WalletCard';
import { useState } from 'react';

//for routing
import Layout from './pages/Layout.js';
import Home from './pages/index.js';
import Listings from './pages/Listings.js';
import {Login} from './pages/Login.js';
import Rent from './pages/Rent.js';
import Blog from './pages/Blogs.js';
import { BrowserRouter, Routes, Route } from "react-router-dom";
  
const App = () => {
  return (
      <div>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="listings" element={<Listings />} />
              <Route path="login" element={<Login />} />
              <Route path="rent" element={<Rent />} />
              <Route path="blog" element={<Blog />} />
            </Route>
          </Routes>
      </BrowserRouter>
      </div>
  );
}

export default App;
