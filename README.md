# BT4101 FYP Project 
FashRent NFT Fashion Rental Platform

## Introduction
A NFT Fashion Rental platform developed for renting luxury fashion NFTs.
Built using Solidity 0.8.17 and React-js.
Deployed on Sepolia Testnet.

## Setting up
1. Install solidity >= 0.8, node-js 18.12.1.
2. Clone the folder to your localhost using `git clone https://github.com/CWei88/BT4101_NFT_Platform`
3. Navigate to the rental platform folder using `cd rental-contracts` if you are not in the `/rental-contracts` folder.
4. Install all relevant packages using `npm install` to install all dependencies.
5. Once installed, build the frontend using `npm run build` if you have not done so.
6. Once built, run `npm start` in your terminal to start up the frontend. Both the frontend and backend will be running once `npm start` is called.

## Deploying smart contract to local network.
Alternatively, you can deploy the backend to a local hardhat network by:

Running `npx hardhat run --network localhost scripts/deploy.js`

