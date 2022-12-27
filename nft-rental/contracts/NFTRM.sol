pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";
import "./ERC4907.sol";

contract NFTRM is ReentrancyGuard {
    //Global Variables
    using Counters for Counters.Counter;
    //Check number of nftRentedOut
    Counters.Counter private nftRented;
    //Checks number of NFT in the marketplace
    Counters.Counter private nftListed;
    address payable marketOwner;
    //Fee charged by platform to list NFT.
    uint256 listPrice = 0.01 ether;

    mapping(uint256 => LToken) private idToListedToken;

    //Structure of Listed Token
    struct LToken {
        address nftAddress;
        uint256 tokenId;
        address payable owner;
        address payable seller;
        address user;
        uint256 price;
        uint64 expiry;
        bool currentlyListed;
    }

    //Emit event when token is listed.
    event LTokenListed (
        address nftAddress,
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        uint64 expiry
    );

    //Emit event when token is rented out.
    event LTokenRentedOut (
        address nftAddress,
        uint256 indexed tokenId,
        address seller,
        address user,
        uint256 price,
        uint64 expiry
    );

    constructor () {
        marketOwner = payable(msg.sender);
    }

    //Listing NFT on Marketplace
    function listNFT(address _nftAddress, uint256 tokenId, uint256 price, uint64 expiry) public payable nonReentrant {
        //Checks if sender has enough ETH to pay for listing
        require(msg.value == listPrice, "Not enough ETH to pay for platform fees");
        //Ensure price is not negative
        require(price > 0, "Price cannot be negative");
        //Ensure expiry date is legit
        require(expiry > block.timestamp, "Expiry date cannot be earlier than now.");

        ERC4907(_nftAddress).transferFrom(msg.sender, address(this), tokenId);

        nftListed.increment();

        idToListedToken[tokenId] = LToken(
            _nftAddress, tokenId, payable(address(this)), payable(msg.sender), address(0),
            price, expiry, true
        );

        emit LTokenListed(_nftAddress, tokenId, address(this), msg.sender, price, expiry);
    }

    //Rent an NFT
    function rentNFT(uint256 tokenId, address rentee) public payable nonReentrant {
        LToken storage nft = idToListedToken[tokenId];
        require(msg.value >= nft.price, "Price not enough to rent NFT");
        require(nft.currentlyListed == true, "NFT is not listed");

        payable(nft.seller).transfer(msg.value);
        ERC4907(nft.nftAddress).setUser(tokenId, payable(rentee), nft.expiry);
        marketOwner.transfer(listPrice);
        nft.user = payable(rentee);
        nft.currentlyListed = false;

        //idToListedToken[tokenId] = nft;

        nftRented.increment();
        emit LTokenRentedOut(nft.nftAddress, tokenId, nft.seller, rentee, msg.value, nft.expiry);
    }

    //Get all NFTs
    function getAllNFTs() public view returns (LToken[] memory) {
        uint nftCount = nftListed.current();
        LToken[] memory tokens = new LToken[](nftCount);
        uint currIndex = 0;
        
        for (uint i = 0; i < nftCount; i++) {
            tokens[currIndex] = idToListedToken[i+1];
            currIndex += 1;
        }

        return tokens;
    }

    //Gets all currently listed NFT
    function getListedNFTs() public view returns (LToken[] memory) {
        uint256 nftCount = nftListed.current();
        uint256 storedNFTCount = nftCount - nftRented.current();

        LToken[] memory tokens = new LToken[](storedNFTCount);
        uint currIndex = 0;
        
        for (uint i = 0; i < nftCount; i++) {
            if (idToListedToken[i+1].currentlyListed) {
                tokens[currIndex] = idToListedToken[i+1];
                currIndex += 1;
            }
        }

        return tokens;
    }

    function getMyNFTs() public view returns (LToken[] memory) {
        uint nftCount = nftListed.current();
        uint myNFTs = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (idToListedToken[i + 1].seller == msg.sender) {
                myNFTs += 1;
            } else if ((idToListedToken[i+1].user == msg.sender) && (idToListedToken[i+1].expiry > block.timestamp)) {
                myNFTs += 1;
            }
        }

        LToken[] memory tokens = new LToken[](myNFTs);
        uint currIndex = 0;
        for (uint i=0; i < nftCount; i++) {
            if (idToListedToken[i+1].seller == msg.sender) {
                tokens[currIndex] = idToListedToken[i+1];
                currIndex += 1;
            } else if ((idToListedToken[i+1].user == msg.sender) && (idToListedToken[i+1].expiry > block.timestamp)) {
                tokens[currIndex] = idToListedToken[i+1];
                currIndex += 1;
            }
        }

        return tokens;
    }

    //Gets NFT Rented Out
    function getMyRentedNFT() public view returns (LToken[] memory) {
        uint nftCount = nftListed.current();
        uint rentedNFTs = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (idToListedToken[i+1].seller == msg.sender && idToListedToken[i+1].user != address(0)) {
                rentedNFTs += 1;
            }
        }

        LToken[] memory tokens = new LToken[](rentedNFTs);
        uint currIndex = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (idToListedToken[i+1].seller == msg.sender && idToListedToken[i+1].user != address(0)) {
                tokens[currIndex] = idToListedToken[i + 1];
                currIndex += 1;
            }
        }

        return tokens;
    }


    //Gets Listed NFTs
    function getMyListedNFTs() public view returns (LToken[] memory) {
        uint nftCount = nftListed.current();
        uint listedNFTs = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (idToListedToken[i+1].seller == msg.sender && idToListedToken[i+1].currentlyListed) {
                listedNFTs += 1;
            }
        }

        LToken[] memory tokens = new LToken[](listedNFTs);
        uint currIndex = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (idToListedToken[i+1].seller == msg.sender && idToListedToken[i+1].currentlyListed) {
                tokens[currIndex] = idToListedToken[i+1];
                currIndex += 1;
            }
        }

        return tokens;
    }

    //Get specific NFT owner
    function getNFTOwner(uint256 tokenId) public view returns (address) {
        LToken memory tok = idToListedToken[tokenId];
        return tok.seller;
    }

    //Get the current listing fee
    function getListingFee() public view returns (uint256) {
        return listPrice;
    }
}