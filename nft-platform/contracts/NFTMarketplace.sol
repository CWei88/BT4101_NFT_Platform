pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

error PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error ItemNotForSale(address nftAddress, uint256 tokenId);
error NotListed(address nftAddress, uint256 tokenId);
error AlreadyListed(address nftAddress, uint256 tokenId);
error NoProfits();
error NotOwner();
error NotApprovedForMarketplace();
error PriceNotAboveZero();

contract NFTMarketplace is ReentrancyGuard {

    struct Listing {
        uint256 price;
        address seller;
    }

    //events

    event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price);

    event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId);

    event ItemBought(address indexed buyer, address indexed nftAddress, uint256 indexed tokenId, uint256 price);

    event ItemRented(address indexed renter, address indexed nftAddress, uint256 indexed tokenId, uint256 price);

    //State Variables
    mapping(address => mapping(uint256 => Listing)) private s_listings; //mapping of nft contract address to token id, pointing to Listing struct.
    mapping(address => uint256) private s_proceeds; //mapping between seller address and the amount they earned in sales.
    
    //Function modifiers
    modifier notListed(address nftAddress, uint256 tokenId, address owner) { //Checks if tokenId has been listed.
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NotListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(address nftAddress, uint256 tokenId, address spender) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NotOwner();
        }
        _;
    }

    //main functions

    function listItem(address nftAddress, uint256 tokenId, uint256 price) external 
    notListed(nftAddress, tokenId, msg.sender) isOwner(nftAddress, tokenId, msg.sender) {
        if (price <= 0) {
            revert PriceNotAboveZero();
        }
        
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NotApprovedForMarketplace();
        }

        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    // deletes token from s_listing to prevent token from being sold.
    function cancelListing(address nftAddress, uint256 tokenId) external isOwner(nftAddress, tokenId, msg.sender) isListed(nftAddress, tokenId) {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }


    // Function must protect against re-entrancy and pmt is added to seller proceeds.
    // Item is delisted after transaction and token is transferred to buyer
    function buyItem(address nftAddress, uint256 tokenId) external payable isListed(nftAddress, tokenId) nonReentrant {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert PriceNotMet(nftAddress, tokenId, listedItem.price);
        }

        s_proceeds[listedItem.seller] += msg.value;
        delete (s_listings[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice) external isListed(nftAddress, tokenId) 
    nonReentrant isOwner(nftAddress, tokenId, msg.sender) {
        if (newPrice <= 0) {
            revert PriceNotAboveZero();
        }

        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    // Used to allow owner to withdraw profit from sale. If no profits are present, throw a noProfit error.
    function withdrawProfit() external {
        uint256 profits = s_proceeds[msg.sender];
        if (profits <= 0) {
            revert NoProfits();
        }

        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: profits} (""); //Call solidity payable to send value. "" indicates no argument in the call.
        require(success, "Transfer failed"); //If process fails, the process is reverted.
    }

    function getListing(address nftAddress, uint256 tokenId) external view returns(Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProfits(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }



}