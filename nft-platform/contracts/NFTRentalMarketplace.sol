pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./ERC4907.sol";

error PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error ItemNotForSale(address nftAddress, uint256 tokenId);
error NotListed(address nftAddress, uint256 tokenId);
error AlreadyListed(address nftAddress, uint256 tokenId);
error NoProfits();
error NotOwner();
error NotApprovedForMarketplace();
error PriceNotAboveZero();
error InvalidTime();

contract NFTRentalMarketplace is ReentrancyGuard {
    
    struct Listing {
        address seller;
        uint256 price;
        uint64 expiry;
    }

    //Events
    event ItemListed(address indexed seller, address indexed nftAddress, uint256 indexed tokenId, uint256 price, uint64 expires);

    event ItemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId);

    event ItemRented(address indexed renter, address indexed nftAddress, uint256 indexed tokenId, uint256 price);
    
    //State Variables
    mapping(address => mapping(uint256 => Listing)) private r_listings;
    mapping(address => uint256) private s_proceeds; //mapping between seller address and the amount they earned in sales.
    
    //Modifiers
    modifier notListed(address nftAddress, uint256 tokenId, address owner) {
        Listing memory listed = r_listings[nftAddress][tokenId];
        if (listed.price > 0) {
            revert AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isOwner(address nftAddress, uint256 tokenId, address spender) {
        ERC4907 nft = ERC4907(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NotOwner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listed = r_listings[nftAddress][tokenId];
        if (listed.price < 0) {
            revert NotListed(nftAddress, tokenId);
        }
        _;
    }

    //Rental functions
    function rentalListing(address nftAddress, uint256 tokenId, uint256 price, uint64 expires) external 
    notListed(nftAddress, tokenId, msg.sender) isOwner(nftAddress, tokenId, msg.sender) {
        if (price <= 0) {
            revert PriceNotAboveZero();
        }

        if (expires <= block.timestamp) {
            revert InvalidTime();
        }

        ERC4907 nft = ERC4907(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NotApprovedForMarketplace();
        }

        r_listings[nftAddress][tokenId] = Listing(msg.sender, price, expires);
        emit ItemListed(msg.sender, nftAddress, tokenId, price, expires);
        
    }

    function rentItem(address nftAddress, address user, uint256 tokenId, uint64 expires) external payable isListed(nftAddress, tokenId) nonReentrant {
        Listing memory listedItem = r_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert PriceNotMet(nftAddress, tokenId, listedItem.price);
        }

        s_proceeds[listedItem.seller] += msg.value;
        delete (r_listings[nftAddress][tokenId]);
        ERC4907(nftAddress).setUser(tokenId, user, expires);
        emit ItemRented(msg.sender, nftAddress, tokenId, expires);
    }

    function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice, uint64 newExpiry) 
    external isListed(nftAddress, tokenId) isOwner(nftAddress, tokenId, msg.sender) {
        if (newPrice <= 0) {
            revert PriceNotAboveZero();
        }
        
        if (newExpiry <= block.timestamp) {
            revert InvalidTime();
        }

        r_listings[nftAddress][tokenId].price = newPrice;
        r_listings[nftAddress][tokenId].expiry = newExpiry;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice, newExpiry);
    }

    function cancelListing(address nftAddress, uint256 tokenId) external isOwner(nftAddress, tokenId, msg.sender) isListed(nftAddress, tokenId) {
        delete (r_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
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

    function getListing(address nftAddress, uint256 tokenId) public view returns(Listing memory) {
        return r_listings[nftAddress][tokenId];
    }

    function getProfits(address seller) public view returns (uint256) { 
        return s_proceeds[seller];
    }
}