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
    uint256 commsPercentage = 0; //Percentage as comms out of 100.
    bool allStop = false; //Failsafe 

    mapping(address => mapping(uint256 => Listing)) private rentalListings; //used to store rental listings for retrieval.
    mapping(address => mapping(uint256 => mapping(address => Bid))) private rentalBids; //used to store bids for rentals.
    mapping(address => mapping(uint256 => Rental)) private currentlyRented; //store currently rented NFTs.
    mapping(address => mapping(uint256 => Bid[])) private bidStorage; // Bid storage to get number of bid for each nft.
    mapping(address => Bid[]) private renterBids; //Stores list of bids that renter has bidded.
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
        bool isDirect;
    }

    struct Bid { //Bid to manage rental bidding.
        address contractAddress;
        uint256 tokenId;
        address payable rentee;
        uint256 pricePerDay;
        uint256 rentalDays;
        uint256 totalBid;
        uint256 bidTime;
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

    event TokenListed(address indexed _nftAddress, uint256 indexed tokenId, uint256 pricePerDay, uint256 minRentalDays, uint256 maxRentalDays, uint256 listingExpiry, bool isDirect);
    event TokenBid(address indexed _nftAddress, uint256 indexed tokenId, uint256 rentalDays, uint256 bidAmt);
    event TokenRented(address indexed _nftAddress, uint256 indexed tokenId, address rentee, uint256 pricePerDay, uint256 rentalDays, address _sender);
    event TokenDelisted(address _nftAddress, uint256 tokenId, bool availableToRent);
    event TokenClaimed(address indexed _nftAddress, uint256 indexed tokenId, address _sender);
    event FeeUpdated(uint256 _from, uint256 _to, address _sender);
    event feeCollectorUpdated(address _from, address _to, address _sender);
    event commsUpdated(uint256 _from, uint256 _to, address sender);
    event BidReceived(address rentee, uint256 bidAmt);
    event BidReturned(address bidder, uint256 bidAmt);
    event ComissionWithdrawn(address feeCollector, uint256 feeWithdrawn);

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

    constructor(address _owner, address _feeCollector, uint256 _fee, uint256 _commsPercentage) {
        marketOwner = _owner;
        feeCollector = payable(_feeCollector);
        listingFee = _fee;
        commsPercentage = _commsPercentage;
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
    function listNFT(address _nftAddress, uint256 tokenId, uint256 pricePerDay, uint256 minRentalDays, uint256 maxRentalDays, uint256 listingExpiry, bool isDirect) 
    public payable nonReentrant onlyOwner(_nftAddress, tokenId) transactionResumed {
        //Checks if token is ERC4907
        require(IERC165(_nftAddress).supportsInterface(IID_ERC4907) == true, "Token is not ERC4907, please wrap token");
        //Ensure that lister has sent ether to pay for listingfee.
        require(msg.value >= listingFee, "Not enough ETH to pay for platform fees");
        //Ensure price is not negative
        require(pricePerDay > 0, "Price must be higher than zero");
        //Ensure listing expiry date is legit, and less than rental expiry.
        require(listingExpiry > block.timestamp, "Listing expiry must be longer than current time.");

        ERC4907(_nftAddress).safeTransferFrom(msg.sender, address(this), tokenId);

        payable(address(this)).transfer(msg.value);

        Listing memory lister = Listing(_nftAddress, tokenId, payable(msg.sender), pricePerDay, minRentalDays, maxRentalDays, listingExpiry, true, isDirect);
        rentalListings[_nftAddress][tokenId] = lister;

        uint256 index = listedTokens.length;
        listingIndex[_nftAddress][tokenId] = index;
        listedTokens.push(lister);

        emit TokenListed(_nftAddress, tokenId, pricePerDay, minRentalDays, maxRentalDays, listingExpiry, isDirect);
    }

    function bidNFT(address _nftAddress, uint256 tokenId, uint256 rentalDays) public payable nonReentrant transactionResumed{
        Listing storage token = rentalListings[_nftAddress][tokenId];
        require(msg.sender != token.owner, "Owner cannot bid for their own NFTs");
        require(msg.sender != address(0), "Bidder cannot be from address(0)");
        require(rentalDays >= token.minRentalDays, "Rental Days cannot be shorter than minimum");
        require(rentalDays <= token.maxRentalDays, "Rental Days cannot be longer than maximum");
        require(token.listingExpiry > block.timestamp, "Listing has expired");
        require(!token.isDirect, "Token is not biddable");
        uint256 totalBid = token.pricePerDay * rentalDays;
        require(msg.value >= totalBid, "Bid lower than minimum rental price!");
        require(token.availableToRent == true, "Token is not available for Rental");
        require(currentlyRented[_nftAddress][tokenId].rentalEnd == 0, "Token has been rented out");

        Bid memory newBid = Bid(_nftAddress, tokenId, payable(msg.sender), token.pricePerDay, rentalDays, msg.value, block.timestamp);
        rentalBids[_nftAddress][tokenId][msg.sender] = newBid;
        Bid[] memory bidStore = bidStorage[_nftAddress][tokenId];
        bool isChanged = false;

        //Checks if the rentee has previously bidded, and updates the bids instead.
        for (uint256 i=0; i < bidStore.length; i++) {
            Bid memory cBid = bidStore[i];
            if (cBid.rentee == msg.sender) {
                returnBid(msg.sender, cBid.totalBid);
                bidStore[i] = newBid;
                isChanged = true;
            }
        }

        if (!isChanged) { //if there was no such bid from the rentee before.
            bidStorage[_nftAddress][tokenId].push(newBid);
        }

        if (renterBids[msg.sender].length != 0) {
            renterBids[msg.sender] = addRenterBid(newBid, msg.sender);
        } else {
            renterBids[msg.sender].push(newBid);
        }

        emit TokenBid(_nftAddress, tokenId, rentalDays, msg.value);
    }

    function acceptBid(address _nftAddress, uint256 tokenId, address rentee) public payable nonReentrant transactionResumed {
        Listing storage token = rentalListings[_nftAddress][tokenId];
        Bid memory acceptedBid = rentalBids[_nftAddress][tokenId][rentee];
        require(token.owner == msg.sender, "Caller is not token owner");

        uint256 rentalDuration = acceptedBid.rentalDays;
        uint256 acceptedAmt = acceptedBid.totalBid;
        address payable owner = token.owner;

        _bidRental(_nftAddress, tokenId, owner, rentee, rentalDuration, acceptedAmt);

        emit TokenRented(_nftAddress, tokenId, rentee, rentalDuration, token.pricePerDay, msg.sender);
    }

    function rejectBid(address _nftAddress, uint256 tokenId, address rentee) public payable nonReentrant transactionResumed {
        Listing storage token = rentalListings[_nftAddress][tokenId];
        Bid memory rejectedBid = rentalBids[_nftAddress][tokenId][rentee];
        require(token.owner == msg.sender, "Caller is not token owner");
        require(rejectedBid.rentee != address(0), "Bid does not exist");

        Bid[] storage bidS = bidStorage[_nftAddress][tokenId];
        
        uint256 index = 0;
        for (uint256 i=0; i < bidS.length; i++) {
            Bid memory bidded = bidS[i];
            if (bidded.rentee == rentee) {
                index = i;
            }
        }

        for (uint256 i=index; i<bidS.length - 1; i++) {
            bidS[i] = bidS[i+1];
        }
        bidS.pop();
        bidStorage[_nftAddress][tokenId] = bidS;

        renterBids[rentee] = removeRenterBid(_nftAddress, tokenId, rentee);

        uint256 bidAmt = rejectedBid.totalBid;
        returnBid(rentee, bidAmt);
        delete rentalBids[_nftAddress][tokenId][rentee];
    }

    function withdrawBid(address _nftAddress, uint256 tokenId) public payable nonReentrant {
        Bid memory withdrawnBid = rentalBids[_nftAddress][tokenId][msg.sender];
        require(withdrawnBid.rentee != address(0), "Bid does not exist");

        Bid[] storage bidS = bidStorage[_nftAddress][tokenId];

        uint256 index = 0;
        for (uint256 i=0; i < bidS.length; i++) {
            Bid memory bidded = bidS[i];
            if (bidded.rentee == msg.sender ) {
                index = i;
            }
        }

        for (uint256 i=index; i<bidS.length - 1; i++) {
            bidS[i] = bidS[i+1];
        }
        bidS.pop();
        bidStorage[_nftAddress][tokenId] = bidS;

        renterBids[msg.sender] = removeRenterBid(_nftAddress, tokenId, msg.sender);

        uint256 bidAmt = withdrawnBid.totalBid;
        returnBid(msg.sender, bidAmt);
        delete rentalBids[_nftAddress][tokenId][msg.sender];
    }


    //Immediate rental of NFT without a bidding process.
    function rentNFT(address _nftAddress, uint256 tokenId, uint64 rentalDays) public payable nonReentrant transactionResumed {
        Listing storage token = rentalListings[_nftAddress][tokenId];
        require(rentalDays >= token.minRentalDays, "Cannot rent for less than minimum");
        require(rentalDays <= token.maxRentalDays, "Cannot rent for more than maximum");
        require(token.isDirect, "Token is not directly rentable");
        uint256 totalRentalPrice = token.pricePerDay * rentalDays;
        uint256 rentalExpiryTime = block.timestamp + (rentalDays * 24 * 60 * 60);
        require(token.listingExpiry > block.timestamp, "Listing has expired");
        require(msg.value >= totalRentalPrice, "Insufficient ether to pay for rental");
        require(token.availableToRent == true, "Token is not available for Rental");
        require(currentlyRented[_nftAddress][tokenId].rentalEnd == 0, "Token has been rented out");

        uint256 commsRecv = (msg.value * commsPercentage)/100;
        uint256 OwnrTrf = msg.value - commsRecv;

        payable(token.owner).transfer(OwnrTrf);
        payable(address(this)).transfer(commsRecv);

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

        Listing memory lister = Listing(_nftAddress, tokenId, payable(msg.sender), token.pricePerDay, token.minRentalDays, token.maxRentalDays, token.listingExpiry, false, token.isDirect);
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

    //function to process renting to bids, and returning unaccepted bids to rentee.
    function _bidRental(address _nftAddress, uint256 tokenId, address owner, address rentee, uint256 rentalDays, uint256 bidAmt) private {
        Bid[] memory bidStore = bidStorage[_nftAddress][tokenId];
        uint256 commsRecv = (bidAmt * commsPercentage)/100;
        uint256 ownerTrf = bidAmt - commsRecv;
        
        payable(owner).transfer(ownerTrf);
        payable(address(this)).transfer(commsRecv);

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
                renterBids[bidded.rentee] = removeRenterBid(_nftAddress, tokenId, bidded.rentee);
            }
        }

        delete bidStorage[_nftAddress][tokenId];
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

    //Function to update comission percentage;
    function updateComission(uint256 _commsPercentage) public marketplaceOwner() {
        uint256 oldComms = commsPercentage;
        commsPercentage = _commsPercentage;

        emit commsUpdated(oldComms, commsPercentage, msg.sender);
    }

    //Getter function for all available bids
    function getAllBids(address _nftAddress, uint256 tokenId) public view returns(Bid[] memory){
        Listing memory token = rentalListings[_nftAddress][tokenId];
        require(token.owner == msg.sender, "Caller is not token owner");

        Bid[] storage toks = bidStorage[_nftAddress][tokenId];
        uint256 bidsAvailable = 0;
        uint256 currTime = block.timestamp;
        for (uint256 i=0; i < toks.length; i++) {
            Bid memory currBid = toks[i];
            if (currBid.bidTime + (1*24*60*60) >= currTime) {
                bidsAvailable += 1;
            }
        }

        uint256 j = 0;
        Bid[] memory available = new Bid[](bidsAvailable);
        for (uint256 i=0; i < toks.length; i++) {
            Bid memory currBid = toks[i];
            if (currBid.bidTime + (1*24*60*60) >= currTime) {
                available[j] = currBid;
                j += 1;
            }
        }

        return available;
    }

    function getMyBids() public view returns (Bid[] memory) {
        return renterBids[msg.sender];
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

    function getOwnedListings() public view returns(Listing[] memory) {
        uint256 numOwned = 0;
        for (uint256 i=0; i<listedTokens.length; i++) {
            Listing memory listed = listedTokens[i];
            if (listed.owner == msg.sender) {
                numOwned += 1;
            }
        }

        Listing[] memory ownedListings = new Listing[](numOwned);
        uint j=0;
        for (uint256 i=0; i < listedTokens.length; i++) { 
            Listing memory listed = listedTokens[i];
            if (listed.owner == msg.sender) {
                ownedListings[j] = listed;
                j += 1;
            }
        }

        return ownedListings;
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

    function withdrawComission() external payable nonReentrant {
        require(msg.sender == feeCollector, "Only feeCollector can withdraw");
        uint256 currBalance = address(this).balance;
        feeCollector.transfer(currBalance);

        emit ComissionWithdrawn(msg.sender, currBalance);
    }
    
    function getComissionBalance() public view returns(uint256) {
        require(msg.sender == feeCollector || msg.sender == marketOwner, "No permission to view balance");
        return address(this).balance;
    }


    //private function to return bids that are not accepted
    function returnBid(address bidder, uint256 valueToReturn) private {
        address payable returner = payable(bidder);
        returner.transfer(valueToReturn);
        emit BidReturned(bidder, valueToReturn);
    }

    //private function to update bids of rentee
    function addRenterBid(Bid memory bid, address rentee) private returns(Bid[] storage){
        Bid[] storage renteeBids = renterBids[rentee];
        bool hasBidded = false;

        for (uint256 i=0; i < renteeBids.length; i++) {
            Bid memory cBid = renteeBids[i];
            if (cBid.contractAddress == bid.contractAddress && cBid.tokenId == bid.tokenId) {
                renteeBids[i] = bid;
                hasBidded = true;
            }
        }

        if (!hasBidded) {
            renteeBids.push(bid);
        }

        return renteeBids;
    }

    function removeRenterBid(address nftAddress, uint256 tokenId, address rentee) private returns(Bid[] storage){
        Bid[] storage renteeBids = renterBids[rentee];
        uint256 index = 0;

        for (uint256 i=0; i < renteeBids.length; i++) {
            Bid memory cBid = renteeBids[i];
            if (cBid.contractAddress == nftAddress && cBid.tokenId == tokenId) {
                index = i;
            }
        }

        for (uint256 j=index; j < renteeBids.length - 1; j++) {
            renteeBids[j] = renteeBids[j+1];
        }

        renteeBids.pop();
        return renteeBids;
    }
}