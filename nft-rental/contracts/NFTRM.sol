pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";
import "./ERC4907/ERC4907.sol";
import "./ERC4907/ERC4907Wrapper.sol";

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
    mapping(uint256 => mapping(address => Bid)) private idBids;
    mapping(uint256 => uint256) numBids;
    address[] bidAddresses;

    //Structure of Bid
    struct Bid {
        address bidder;
        uint256 price;
        uint64 expiry;
    }

    //Structure of Listed Token
    struct LToken {
        address nftAddress;
        uint256 tokenId;
        address payable owner;
        address payable seller;
        address user;
        uint256 price;
        uint64 expiry;
        uint64 listingExpiry;
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
    
    //Emit when a rental bid is made
    event LTokenBid (
        address nftAddress,
        uint256 indexed tokenId,
        address seller,
        address user,
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

    //Emit event when token is updated
    event LTokenUpdated(
        address nftAddress,
        uint256 indexed tokenId,
        address seller,
        address user,
        uint256 price,
        uint64 expiry
    );

    //Emit when token is delisted
    event LTokenDelisted (
        address nftAddress,
        uint256 indexed tokenId,
        address owner,
        address seller
    );

    event expiredNFT(uint256 indexed tokenId);

    modifier onlyOwner(address nftAddress, uint256 tokenId) {
        address owner = IERC721(nftAddress).ownerOf(tokenId);
        require(owner == msg.sender, "ERC721: Caller is not owner or approved");
        _;
    }

    constructor () {
        marketOwner = payable(msg.sender);
    }


    //Listing NFT on Marketplace
    function listNFT(address _nftAddress, uint256 tokenId, uint256 price, uint64 expiry, uint64 listingExpiry) public payable nonReentrant onlyOwner(_nftAddress, tokenId) {
        //Checks if sender has enough ETH to pay for listing
        require(msg.value == listPrice, "Not enough ETH to pay for platform fees");
        //Ensure price is not negative
        require(price > 0, "Price cannot be negative");
        //Ensure expiry date is legit
        require(expiry > block.timestamp, "Expiry date cannot be earlier than now.");
        //Ensure listing expiry date is legit, and less than rental expiry.
        require(listingExpiry > block.timestamp, "Listing expiry cannot be negative");
        require(listingExpiry <= expiry, "Expiry time cannot be shorter than listing expiry");

        ERC4907(_nftAddress).transferFrom(msg.sender, address(this), tokenId);

        nftListed.increment();

        idToListedToken[tokenId] = LToken(
            _nftAddress, tokenId, payable(address(this)), payable(msg.sender), address(0),
            price, expiry, listingExpiry, true
        );

        emit LTokenListed(_nftAddress, tokenId, address(this), msg.sender, price, expiry);
    }

    //Offering to rent NFT
    function offerToRent(uint256 tokenId, uint256 price, uint64 expiry) public payable nonReentrant {
        LToken storage nft = idToListedToken[tokenId];
        //Checks that offer is higher than rental price
        require(price >= nft.price, "price not enough for NFT");
        //Checks that rental is currently listed
        require(nft.currentlyListed == true, "NFT is not listed");
        //Checks that bid timing has not resulted in nft being unusable.
        require(expiry > block.timestamp, "Offer expiry date is earlier than current time");
        // Checks that the listing has not expired yet.
        require(nft.listingExpiry > block.timestamp, "Listing has expired");
        //Checks that expiry bid does not exceed nft expiry time
        require(nft.expiry >= expiry, "Offer expiry date is longer than listed date");
        
        if (idBids[tokenId][msg.sender].price == 0) {
            numBids[tokenId] += 1;
        }
        idBids[tokenId][msg.sender] = Bid(payable(msg.sender), price, expiry);
        bidAddresses.push(payable(msg.sender));

        emit LTokenBid(nft.nftAddress, tokenId, nft.seller, msg.sender, price, expiry);
    }
    
    //Viewing all bids received by token
    function viewAllBids(uint256 tokenId) public view returns(Bid[] memory) {
        LToken storage nft = idToListedToken[tokenId];
        require (nft.seller == msg.sender, "Address not listing party");
        Bid[] memory getAllBids = new Bid[](numBids[tokenId]);
        for (uint i=0; i < numBids[tokenId]; i++) {
            getAllBids[i] = idBids[tokenId][bidAddresses[i]];
        }
        return getAllBids;
    }


    //Function to Accept bids
    //To overwrite rentNFT function once it is successful
    function acceptOffer(uint256 tokenId, address renter) public payable nonReentrant {
        LToken storage nft = idToListedToken[tokenId];
        require(nft.seller == msg.sender, "Address not listing party");
        require(nft.currentlyListed == true, "NFT is not listed");
        require(nft.expiry > block.timestamp, "NFT expiry date is longer than current time");
        require(nft.listingExpiry > block.timestamp, "Listing has expired");

        Bid memory getBid = idBids[tokenId][renter];
        uint256 pricePaid =  getBid.price;
        uint256 priceToPlatform = (pricePaid * 2) / 10;
        uint256 priceToSeller = pricePaid - priceToPlatform;
        console.log("price is %s and %s", listPrice, priceToSeller);
        (nft.seller).transfer(priceToSeller);
        ERC4907(nft.nftAddress).setUser(tokenId, renter, nft.expiry);
        marketOwner.transfer(listPrice + priceToPlatform);
        nft.user = renter;
        nft.currentlyListed = false;

        nftRented.increment();
        emit LTokenRentedOut(nft.nftAddress, tokenId, nft.seller, renter, getBid.price, nft.expiry);
    }

    //Rent an NFT
    function rentNFT(uint256 tokenId) public payable nonReentrant {
        LToken storage nft = idToListedToken[tokenId];
        require(msg.value >= nft.price, "Price not enough to rent NFT");
        require(nft.currentlyListed == true, "NFT is not listed");        
        //Checks that bid timing has not resulted in nft being unusable.
        require(nft.expiry > block.timestamp, "NFT expiry date is longer than current time");
        // Checks that the listing has not expired yet.
        require(nft.listingExpiry > block.timestamp, "Listing has expired");

        uint256 pricePaid = msg.value;
        uint256 priceToPlatform =  pricePaid * 2 / 10;
        uint256 priceToSeller = pricePaid - priceToPlatform;
        payable(nft.seller).transfer(priceToSeller);
        ERC4907(nft.nftAddress).setUser(tokenId, payable(msg.sender), nft.expiry);
        marketOwner.transfer(listPrice + priceToPlatform);
        nft.user = payable(msg.sender);
        nft.currentlyListed = false;

        //idToListedToken[tokenId] = nft;

        nftRented.increment();
        emit LTokenRentedOut(nft.nftAddress, tokenId, nft.seller, msg.sender, msg.value, nft.expiry);
    }

    //Overloaded function
    //Update NFT Listing price only
    function updateNFT(address _nftAddress, uint256 tokenId, uint256 price) public virtual {
        LToken storage nft = idToListedToken[tokenId];
        require(nft.seller == msg.sender, "Only owner can update NFT listing");
        require(nft.currentlyListed == true, "Can only update existing listing!");
        require(nft.user == address(0), "Cannot edit NFT listing while NFT is rented");
        require(nft.expiry > block.timestamp, "NFT has expired, please update expiry date");
        require(nft.listingExpiry > block.timestamp, "Listing has expired, please update listing expiry");
        require(price > 0, "Price must be positive");

        idToListedToken[tokenId] = LToken(
            _nftAddress, tokenId, payable(address(this)), payable(msg.sender), address(0),
            price, nft.expiry, nft.listingExpiry, true
        );
    }

    //Overloaded function
    //Update NFT expiry date only
    function updateNFT(address _nftAddress, uint256 tokenId, uint64 expiry, uint64 listingExpiry) public virtual {
        LToken storage nft = idToListedToken[tokenId];
        require(nft.seller == msg.sender, "Only owner can update NFT listing");
        require(nft.currentlyListed == true, "Can only update existing listing!");
        require(nft.user == address(0), "Cannot edit NFT listing while NFT is rented");
        require(expiry > block.timestamp, "Expiry date cannot be earlier than current time");
        require(listingExpiry > block.timestamp, "Listing expiry cannot be earlier than current time");

        idToListedToken[tokenId] = LToken(
            _nftAddress, tokenId, payable(address(this)), payable(msg.sender), address(0),
            nft.price, expiry, listingExpiry, true
        );
    }


    //Overloaded function
    //Update NFT listing price and expiry
    function updateNFT(address _nftAddress, uint256 tokenId, uint256 price, uint64 expiry, uint64 listingExpiry) public virtual {
        LToken storage nft = idToListedToken[tokenId];
        require(nft.seller == msg.sender, "Only owner can update NFT listing");
        require(nft.currentlyListed == true, "Can only update existing listing!");
        require(nft.user == address(0), "Cannot edit NFT listing while NFT is rented");
        require(expiry > block.timestamp, "Expiry date cannot be earlier than current time");
        require(listingExpiry > block.timestamp, "Listing expiry cannot be earlier than current time");
        require(price > 0, "Price must be positive");

        idToListedToken[tokenId] = LToken(
            _nftAddress, tokenId, payable(address(this)), payable(msg.sender), address(0),
            price, expiry, listingExpiry, true
        );
    }


    //delist NFT
    function delistNFT(address _nftAddress, uint256 tokenId) public nonReentrant {
        LToken storage nft = idToListedToken[tokenId];
        require(nft.seller == msg.sender, "Only NFT owner can delist");
        require(nft.user == address(0) || nft.expiry < block.timestamp, "User is still using token");

        ERC4907(_nftAddress).transferFrom(address(this), msg.sender, tokenId);

        nftListed.decrement();
        delete (idToListedToken[tokenId]);

        emit LTokenDelisted(_nftAddress, tokenId, address(this), msg.sender);
    }

    //Deals with expired tokens
    function expireNFT(uint256 tokenId) private {
        LToken storage nft = idToListedToken[tokenId];
        nft.currentlyListed = false;

        emit expiredNFT(tokenId);
    }

    //refresh NFTs
    function refreshNFTs() public {
        uint nftCount = nftListed.current();

        for (uint i=0; i < nftCount; i++) {
            LToken memory tok = idToListedToken[i+1];
            if (tok.expiry < block.timestamp) {
                expireNFT(tok.tokenId);
                if (tok.user != address(0)) {
                    nftRented.decrement();
                }
            }
        }
    }

    //Early Loan Termination
    function terminateRental(uint256 tokenId) public {
        LToken storage nft = idToListedToken[tokenId];
        require(nft.user == msg.sender, "Only user can terminate rental");
        require(nft.expiry < block.timestamp, "Cannot terminate already expired loan");

        ERC4907(nft.nftAddress).setUser(tokenId, address(0), nft.expiry);
        nftRented.decrement();
        expireNFT(tokenId);
    }

    //Get all NFTs
    function getAllNFTs() public view returns (LToken[] memory) {
        uint nftCount = nftListed.current();
        LToken[] memory tokens = new LToken[](nftCount);
        uint currIndex = 0;
        
        for (uint i = 0; i < nftCount; i++) {
            if (idToListedToken[i+1].owner != address(0)) {
                tokens[currIndex] = idToListedToken[i+1];
                currIndex += 1;
            }
        }

        return tokens;
    }

    //Gets all currently listed NFT
    function getListedNFTs() public view returns (LToken[] memory) {
        uint256 nftCount = nftListed.current();
        uint256 nftList = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (idToListedToken[i+1].currentlyListed) {
                nftList += 1;
            }
        }

        LToken[] memory tokens = new LToken[](nftList);
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
            } else if ((idToListedToken[i+1].user == msg.sender) && (idToListedToken[i+1].expiry >= block.timestamp)) {
                myNFTs += 1;
            }
        }

        LToken[] memory tokens = new LToken[](myNFTs);
        uint currIndex = 0;
        for (uint i=0; i < nftCount; i++) {
            if (idToListedToken[i+1].seller == msg.sender) {
                tokens[currIndex] = idToListedToken[i+1];
                currIndex += 1;
            } else if ((idToListedToken[i+1].user == msg.sender) && (idToListedToken[i+1].expiry >= block.timestamp)) {
                tokens[currIndex] = idToListedToken[i+1];
                currIndex += 1;
            }
        }

        return tokens;
    }

    //Gets NFT Rented Out
    function getMyRentedNFTs() public view returns (LToken[] memory) {
        uint nftCount = nftListed.current();
        uint rentedNFTs = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (idToListedToken[i+1].seller == msg.sender && idToListedToken[i+1].expiry >= block.timestamp
            && idToListedToken[i+1].user != address(0)) {
                rentedNFTs += 1;
            }
        }

        LToken[] memory tokens = new LToken[](rentedNFTs);
        uint currIndex = 0;
        for (uint i = 0; i < nftCount; i++) {
            if (idToListedToken[i+1].seller == msg.sender && idToListedToken[i+1].expiry >= block.timestamp 
            && idToListedToken[i+1].user != address(0)) {
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

    //Get a specific NFT
    function getNFT(uint256 tokenId) public view returns (LToken memory) {
        return idToListedToken[tokenId];
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