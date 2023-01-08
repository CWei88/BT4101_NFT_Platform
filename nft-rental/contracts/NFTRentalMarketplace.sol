pragma solidity >= 0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "hardhat/console.sol";
import "./ERC4907/ERC4907.sol";

contract NFTRentalMarketplace is ERC721URIStorage {
    //Global Variables
    using Counters for Counters.Counter;
    //Most recent minted TokenId.
    Counters.Counter private tokenIds;
    //Checks the number of tokens in the marketplace
    Counters.Counter private itemsSold;
    address payable owner;
    //Fee charged by platform to list NFT.
    uint256 listPrice = 0.01 ether;

    //Structure of Listed Token
    struct LToken {
        uint256 tokenId;
        address payable owner;
        address payable user;
        uint256 price;
        uint64 expiry;
        bool currentlyListed;
    }

    //Emit event when token is listed.
    event TokenListedSuccess (
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        uint64 expiry,
        bool currentlyListed
    );

    //Maps tokenId to token info and allows us to retrieve details about tokenId.
    mapping(uint256 => LToken) private idtoListedToken;
    
    constructor() ERC721("NFTMarketplace", "NFTMR") {
        owner = payable(msg.sender);
    }

    //Token creation function
    function createToken(string memory tokenURI, uint256 price, uint64 expiry) public payable returns (uint256) {
        tokenIds.increment();
        uint256 newTokenId = tokenIds.current();

        //Mint NFT with newTokenId to address of the user calling createToken.
        _safeMint(msg.sender, newTokenId);

        //Map tokenId to tokenURI containing NFT metadata
        _setTokenURI(newTokenId, tokenURI);

        //Update global variables and create an event.
        createListedToken(newTokenId, price, expiry);

        return newTokenId;
    }

    function createListedToken(uint256 tokenId, uint256 price, uint64 expiry) private {
        //Checks if sender has enough ETH to pay for listing
        require(msg.value >= listPrice, "Not enough ETH to pay for platform fees");
        //Ensure price is not negative
        require(price > 0, "Price cannot be negative");

        //Update token mapping of TokenId to token details to be used to retrieve information
        idtoListedToken[tokenId] = LToken(tokenId, payable(address(this)), payable(msg.sender), price, expiry, true);

        _transfer(msg.sender, address(this), tokenId);
        emit TokenListedSuccess(tokenId, address(this), msg.sender, price, expiry, true);
    }

    function getAllNFTs() public view returns (LToken[] memory) {
        uint nftListed = tokenIds.current();
        uint currIndex = 0;
        uint itemCount = 0;

        //TODO
        //Add filter to filter out for tokens that are not currently listed.
        for (uint i = 1; i <=nftListed; i++) {
            if (idtoListedToken[i].currentlyListed == true) {
                itemCount += 1;
            }
        }

        LToken[] memory tokens = new LToken[] (itemCount);

        for (uint i = 1; i <= nftListed; i++) { 
            if (idtoListedToken[i].currentlyListed == true) {
                LToken storage currItem = idtoListedToken[i];
                tokens[currIndex] = currItem;
                currIndex += 1;
            }
        }
        return tokens;
    }

    //Returns NFT that the current user owns or is selling
    function getMyNFTs() public view returns (LToken[] memory) {
        uint totalItemCount = tokenIds.current();
        uint itemCount = 0;
        uint currIndex = 0;

        //Filter for NFT belonging to user
        for (uint i=1; i <= totalItemCount; i++) {
            if (idtoListedToken[i].owner == msg.sender || idtoListedToken[i].user==msg.sender) {
                itemCount += 1;
            }
        }

        LToken[] memory items = new LToken[](itemCount);
        for (uint i=1; i <= totalItemCount; i++) {
            if (idtoListedToken[i].owner == msg.sender || idtoListedToken[i].user==msg.sender) {
                LToken storage currItem = idtoListedToken[i];
                items[currIndex] = currItem;
                currIndex += 1;
            }
        }

        return items;
    }

    function executeSale(uint256 tokenId) public payable {
        uint price = idtoListedToken[tokenId].price;
        address user = idtoListedToken[tokenId].user;
        require(msg.value == price, "Asking price not met. Purchase cannot proceed");

        //Update token details
        idtoListedToken[tokenId].currentlyListed = true;
        idtoListedToken[tokenId].user = payable(msg.sender);
        itemsSold.increment();

        //Transfer token to new owner
        _transfer(address(this), msg.sender, tokenId);
        //Approve marketplace to sell nft on behalf
        approve(address(this), tokenId);

        //Transfer listing fee to marketplace creator
        payable(owner).transfer(listPrice);
        //Transfer proceeds from the sale to NFT seller
        payable(user).transfer(msg.value);

    }

    function updateListPrice(uint256 listedPrice) public payable {
        require(owner == msg.sender, "Only owner can update the listing price");
        listPrice = listedPrice;
    }

    function getListPrice() public view returns (uint256) {
        return listPrice;
    }

    function getLatestIdToListedToken() public view returns (LToken memory) {
        uint256 currTokenId = tokenIds.current();
        return idtoListedToken[currTokenId];
    }

    function getListedTokenForId(uint256 tokenId) public view returns (LToken memory) {
        return idtoListedToken[tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return tokenIds.current();
    }
    
}