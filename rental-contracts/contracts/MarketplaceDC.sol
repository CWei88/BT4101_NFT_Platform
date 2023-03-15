pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "hardhat/console.sol";
import "./ERC4907/ERC4907.sol";
import "./ERC4907/ERC4907Wrapper.sol";

contract MarketplaceDC is ReentrancyGuard, IERC721Receiver{

    address marketOwner;
    //The user that collects the listingfee.
    address payable feeCollector;
    //Fee charged by platform to list NFT.
    uint256 listingFee;
    bytes4 private constant IID_ERC4907 = type(IERC4907).interfaceId;
    bool allStop = false; //Failsafe 

    mapping(address => mapping(uint256 => Listing)) private rentalListings; //used to store rental listings for retrieval.
    mapping(address => mapping(uint256 => mapping(address => Bid))) private rentalBids; //used to store bids for rentals.
    mapping(address => mapping(uint256 => Rental)) private currentlyRented; //store currently rented NFTs.

    mapping(address => mapping(uint256 => Bid[])) private bidStorage; // Bid storage to get number of bid for each nft.
    //Mapping to get listings and index of listed items.
    mapping(address => mapping(uint256 => uint256)) private listingIndex;
    Listing[] private listedTokens; //Array to store all listed NFTs

    mapping(address => mapping(uint256 => uint256)) private rentalIndex;
    Rental[] private tokensRented;

    struct Listing { //Listing struct to manage rental listings.
        address contractAddress;
        uint256 tokenId;
        address payable owner;
        uint256 pricePerDay;
        uint256 minRentalDays;
        uint256 maxRentalDays;
        uint256 listingExpiry;
        bool availableToRent;
    }

    struct Bid { //Bid to manage rental bidding.
        address contractAddress;
        uint256 tokenId;
        address payable rentee;
        uint256 pricePerDay;
        uint256 rentalDays;
        uint256 totalBid;
    }

    //Struct to store items currently rented out.
    struct Rental {
        address payable owner;
        address payable rentee;
        uint256 rentalEnd;
    }

    //Used for IERC721Receiver
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) public virtual override returns(bytes4){
        return IERC721Receiver.onERC721Received.selector;
    }

    event TokenListed(address indexed _nftAddress, uint256 indexed tokenId, uint256 pricePerDay, uint256 minRentalDays, uint256 maxRentalDays, uint256 listingExpiry);
    event TokenBid(address indexed _nftAddress, uint256 indexed tokenId, uint256 rentalDays, uint256 bidAmt);
    event TokenRented(address indexed _nftAddress, uint256 indexed tokenId, address rentee, uint256 pricePerDay, uint256 rentalDays, address _sender);
    event TokenDelisted(address _nftAddress, uint256 tokenId, bool availableToRent);
    event TokenClaimed(address indexed _nftAddress, uint256 indexed tokenId, address _sender);
    event FeeUpdated(uint256 _from, uint256 _to, address _sender);
    event feeCollectorUpdated(address _from, address _to, address _sender);
    event BidReceived(address rentee, uint256 bidAmt);
    event BidReturned(address bidder, uint256 bidAmt);

    modifier onlyOwner(address nftAddress, uint256 tokenId) {
        address owner = IERC721(nftAddress).ownerOf(tokenId);
        require(owner == msg.sender, "ERC721: Caller is not owner or approved");
        _;
    }

    modifier marketplaceOwner() {
        require(msg.sender == marketOwner, "You are not the owner of the marketplace");
        _;
    }

    modifier transactionStopped() {
        require(allStop == true, "Transaction has not been halted");
        _;
    }

    modifier transactionResumed() {
        require(allStop == false, "Listing and rental has been halted");
        _;
    }

    constructor(address _owner, address _feeCollector, uint256 _fee) {
        marketOwner = _owner;
        feeCollector = payable(_feeCollector);
        listingFee = _fee;
    }

    //Function to stop deposits when there is malicious activity;
    function stopAll() external marketplaceOwner() {
        allStop = true;
    }

    //Function to continue marketplace
    function resumeAll() external marketplaceOwner() {
        allStop = false;
    }

    receive() external payable {
        emit BidReceived(msg.sender, msg.value);
    }

    //Listing function to list NFTs.
    function listNFT(address _nftAddress, uint256 tokenId, uint256 pricePerDay, uint256 minRentalDays, uint256 maxRentalDays, uint256 listingExpiry) 
    public payable nonReentrant onlyOwner(_nftAddress, tokenId) transactionResumed {
        //Ensure that lister has sent ether to pay for listingfee.
        require(msg.value >= listingFee, "Not enough ETH to pay for platform fees");
        //Ensure price is not negative
        require(pricePerDay > 0, "Price must be higher than zero");
        //Ensure listing expiry date is legit, and less than rental expiry.
        require(listingExpiry > block.timestamp, "Listing expiry must be longer than current time.");

        //Checks if token is ERC4907
        require(IERC165(_nftAddress).supportsInterface(IID_ERC4907) == true, "Token is not ERC4907, please wrap token");

        ERC4907(_nftAddress).safeTransferFrom(msg.sender, address(this), tokenId);

        Listing memory lister = Listing(_nftAddress, tokenId, payable(msg.sender), pricePerDay, minRentalDays, maxRentalDays, listingExpiry, true);
        rentalListings[_nftAddress][tokenId] = lister;

        uint256 index = listedTokens.length;
        listingIndex[_nftAddress][tokenId] = index;
        listedTokens.push(lister);

        feeCollector.transfer(msg.value);

        emit TokenListed(_nftAddress, tokenId, pricePerDay, minRentalDays, maxRentalDays, listingExpiry);
    }

    function bidNFT(address _nftAddress, uint256 tokenId, uint256 rentalDays) public payable nonReentrant transactionResumed{
        Listing storage token = rentalListings[_nftAddress][tokenId];
        require(msg.sender != token.owner, "Owner cannot bid for their own NFTs");
        require(rentalDays >= token.minRentalDays, "Rental Days cannot be shorter than minimum");
        require(rentalDays <= token.maxRentalDays, "Rental Days cannot be longer than maximum");
        require(token.listingExpiry > block.timestamp, "Listing has expired");
        uint256 totalBid = token.pricePerDay * rentalDays;
        require(msg.value >= totalBid, "Bid lower than minimum rental price!");
        require(token.availableToRent == true, "Token is not available for Rental");
        require(currentlyRented[_nftAddress][tokenId].rentalEnd == 0, "Token has been rented out");

        Bid memory newBid = Bid(_nftAddress, tokenId, payable(msg.sender), token.pricePerDay, rentalDays, msg.value);
        rentalBids[_nftAddress][tokenId][msg.sender] = newBid;
        Bid[] memory bidStore = bidStorage[_nftAddress][tokenId];
        bool isChanged = false;

        //Checks if the rentee has previously bidded, and updates the bids instead.
        for (uint256 i=0; i < bidStore.length; i++) {
            Bid memory cBid = bidStore[i];
            if (cBid.rentee == msg.sender) {
                bidStore[i] = newBid;
                isChanged = true;
            }
        }

        if (!isChanged) { //if there was no such bid from the rentee before.
            bidStorage[_nftAddress][tokenId].push(newBid);
        }

        emit TokenBid(_nftAddress, tokenId, rentalDays, msg.value);
    }

    function acceptBid(address _nftAddress, uint256 tokenId, address rentee) public payable nonReentrant  transactionResumed {
        Listing storage token = rentalListings[_nftAddress][tokenId];
        Bid memory acceptedBid = rentalBids[_nftAddress][tokenId][rentee];
        require(token.owner == msg.sender, "Caller is not token owner");

        uint256 rentalDuration = acceptedBid.rentalDays;
        uint256 acceptedAmt = acceptedBid.totalBid;
        address payable owner = token.owner;

        _bidRental(_nftAddress, tokenId, owner, rentee, rentalDuration, acceptedAmt);

        emit TokenRented(_nftAddress, tokenId, rentee, rentalDuration, token.pricePerDay, msg.sender);
    }

    function _bidRental(address _nftAddress, uint256 tokenId, address owner, address rentee, uint256 rentalDays, uint256 bidAmt) private {
        require(rentee.balance >= bidAmt, "Insufficient balance to pay for rental");
        Bid[] memory bidStore = bidStorage[_nftAddress][tokenId];
        
        payable(owner).transfer(bidAmt);
        uint256 rentalExpiryTime = block.timestamp + (rentalDays * 24 * 60 * 60);
        ERC4907(_nftAddress).setUser(tokenId, rentee, uint64(rentalExpiryTime));

        Rental memory rentedOut = Rental(payable(owner), payable(msg.sender), rentalExpiryTime);
        currentlyRented[_nftAddress][tokenId] = rentedOut;
        uint256 index = tokensRented.length;
        rentalIndex[_nftAddress][tokenId] = index;
        tokensRented.push(rentedOut);

        //returns bids for bids that are not accepted.
        for (uint256 i=0; i < bidStore.length; i++) {
            Bid memory bidded = bidStore[i];
            if (bidded.rentee != rentee && bidded.totalBid != bidAmt) {
                returnBid(bidded.rentee, bidded.totalBid);
            }
        }

        delete bidStorage[_nftAddress][tokenId];
    }

    //Immediate rental of NFT without a bidding process.
    function rentNFT(address _nftAddress, uint256 tokenId, uint64 rentalDays) public payable nonReentrant transactionResumed {
        Listing storage token = rentalListings[_nftAddress][tokenId];
        require(rentalDays >= token.minRentalDays, "Cannot rent for less than minimum");
        require(rentalDays <= token.maxRentalDays, "Cannot rent for more than maximum");
        uint256 totalRentalPrice = token.pricePerDay * rentalDays;
        uint256 rentalExpiryTime = block.timestamp + (rentalDays * 24 * 60 * 60);
        require(token.listingExpiry > block.timestamp, "Listing has expired");
        require(msg.value >= totalRentalPrice, "Insufficient ether to pay for rental");
        require(token.availableToRent == true, "Token is not available for Rental");
        require(currentlyRented[_nftAddress][tokenId].rentalEnd == 0, "Token has been rented out");

        payable(token.owner).transfer(msg.value);
        ERC4907(token.contractAddress).setUser(tokenId, msg.sender, uint64(rentalExpiryTime));

        Rental memory rentedOut = Rental(token.owner, payable(msg.sender), rentalExpiryTime);
        currentlyRented[_nftAddress][tokenId] = rentedOut;
        uint256 index = tokensRented.length;
        rentalIndex[_nftAddress][tokenId] = index;
        tokensRented.push(rentedOut);

        emit TokenRented(_nftAddress, tokenId, msg.sender, rentalDays, token.pricePerDay, msg.sender);
    }

    //function to delistNFT
    function delistNFT(address _nftAddress, uint256 tokenId) public {
        Rental storage rentedToken = currentlyRented[_nftAddress][tokenId];
        Listing storage token = rentalListings[_nftAddress][tokenId];

        require(token.owner == msg.sender, "Only owner can delist");
        require(rentedToken.rentalEnd == 0 || rentedToken.rentalEnd < block.timestamp, "Token is rented out");
        require(ERC4907(_nftAddress).userOf(tokenId) == address(0), "Rental has not ended!");

        Listing memory lister = Listing(_nftAddress, tokenId, payable(msg.sender), token.pricePerDay, token.minRentalDays, token.maxRentalDays, token.listingExpiry, false);
        rentalListings[_nftAddress][tokenId] = lister;

        uint256 index = listingIndex[_nftAddress][tokenId];
        listedTokens[index] = lister;

        if (rentedToken.rentalEnd != 0) {
            uint256 index2 = rentalIndex[_nftAddress][tokenId];
            delete tokensRented[index2];
            delete currentlyRented[_nftAddress][tokenId];
        }

        emit TokenDelisted(_nftAddress, tokenId, false);

    }

    //function to claim back an NFT back to owner address.
    function claimNFT(address _nftAddress, uint256 tokenId) public {
        Listing storage token = rentalListings[_nftAddress][tokenId];
        require(token.owner == msg.sender, "Only owner can claim back NFT");
        require(token.availableToRent == false, "Token has not been delisted from market");

        ERC4907(_nftAddress).transferFrom(address(this), msg.sender, tokenId);
        uint256 tokenIndex = listingIndex[_nftAddress][tokenId];
        delete listedTokens[tokenIndex];
        delete rentalListings[_nftAddress][tokenId];

        emit TokenClaimed(_nftAddress, tokenId, msg.sender);
    }

    function updateFeeCollector(address newCollector) public marketplaceOwner() {
        address oldCollector = feeCollector;
        feeCollector = payable(newCollector);

        emit feeCollectorUpdated(oldCollector, newCollector, msg.sender);
    }

    function updateFee(uint256 newFee) public marketplaceOwner() {
        uint256 oldFee = listingFee;
        listingFee = newFee;

        emit FeeUpdated(oldFee, listingFee, msg.sender);
    }

    //Getter function for all bids
    function getAllBids(address _nftAddress, uint256 tokenId) public view  returns(Bid[] memory){
        Listing memory token = rentalListings[_nftAddress][tokenId];
        require(token.owner == msg.sender, "Caller is not token owner");
        return bidStorage[_nftAddress][tokenId];
    }

    //Getter function for marketplace
    function getAllListings() public view returns (Listing[] memory) {
        return listedTokens;
    }

    function getAvailableListings() public view returns (Listing[] memory) {
        uint256 numAvailable = 0;
        for (uint256 i=0; i < listedTokens.length; i++) {
            Listing memory listed = listedTokens[i];
            if (listed.availableToRent) {
                numAvailable += 1;
            }
        }

        Listing[] memory available = new Listing[](numAvailable);
        uint256 j =0;
        for (uint256 i=0; i < listedTokens.length; i++) { 
            Listing memory listed = listedTokens[i];
            if (listed.availableToRent) {
                available[j] = listed;
                j += 1;
            }
        }

        return available;
    }

    function getListingFee() public view returns(uint256) {
        return listingFee;
    }

    function getOwnedTokens() public view returns(Listing[] memory) {
        
    }

    function getCurrentlyRented() public view returns (Rental[] memory){
        uint256 numOwned = 0;
        for (uint256 i=0; i<tokensRented.length; i++) {
            Rental memory rent = tokensRented[i];
            if (rent.owner == msg.sender) {
                numOwned += 1;
            }
        }

        Rental[] memory currRented = new Rental[](numOwned);
        uint j = 0;
        for (uint256 i=0; i<tokensRented.length; i++) {
            Rental memory rent = tokensRented[i];
            if (rent.owner == msg.sender) {
                currRented[j] = rent;
                j += 1;
            }
        }

        return currRented;
    }

    //private function to return bids that are not accepted
    function returnBid(address bidder, uint256 valueToReturn) private {
        address payable returner = payable(bidder);
        returner.transfer(valueToReturn);
        emit BidReturned(bidder, valueToReturn);
    }
}