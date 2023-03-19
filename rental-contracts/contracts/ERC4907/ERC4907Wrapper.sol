pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./ERC4907.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract ERC4907Wrapper is ERC4907, IERC721Receiver, ReentrancyGuard {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    address internal wrapperOwner;
    bool internal wrappingAllowed;

    event TokenWrapped(address nftAddress, uint256 tokenId);
    event TokenUnWrapped(address nftAddress, uint256 tokenId);

    struct OriginalToken {
        address nftAddress;
        uint256 tokenId;
        address originalOwner;
    }

    mapping(uint256 => OriginalToken) private wrappedTokens;

    bytes4 public constant InterfaceIERC4907 = type(IERC4907).interfaceId;

    modifier wrappingResumed() {
        require(wrappingAllowed == true, "Wrapping has not been resumed");
        _;
    }

    constructor(string memory _name, string memory _symbol) ERC4907(_name, _symbol) {
        wrapperOwner = msg.sender;
        wrappingAllowed = true;
    }

    function onERC721Received(address operator, address from, uint tokenId, bytes calldata data) public virtual override returns(bytes4)  {
        return this.onERC721Received.selector;
    }

    function wrapToken(address _nftAddress, uint256 tokenId) public virtual wrappingResumed nonReentrant {
        address owner = IERC721(_nftAddress).ownerOf(tokenId);
        require(owner == msg.sender, "Only owner can wrap token");
        uint256 currTokenId = _tokenIds.current();

        ERC721(_nftAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        _safeMint(msg.sender, currTokenId);
        wrappedTokens[currTokenId] = OriginalToken(_nftAddress, tokenId, msg.sender);
        _tokenIds.increment();

        emit TokenWrapped(_nftAddress, currTokenId);
    }

    function unwrapToken(uint256 tokenId) public virtual nonReentrant{
        OriginalToken storage token = wrappedTokens[tokenId];
        address currAddress = token.nftAddress;
        require(IERC721(currAddress).ownerOf(token.tokenId) == address(this), "Invalid wrapped tokenId provided.");
        require(token.originalOwner == msg.sender, "Only original owner can unwrap");

        _burn(tokenId);
        ERC721(token.nftAddress).safeTransferFrom(address(this), msg.sender, tokenId);

        emit TokenUnWrapped(token.nftAddress, tokenId);
    }

    function _burn(uint256 tokenId) internal virtual override(ERC721) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function getAddress() public view returns (address) {
        return address(this);
    }

    /// @dev See {IERC165-supportsInterface}.
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC4907) returns (bool) {
        return interfaceId == type(IERC4907).interfaceId || super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override(ERC4907){
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        if (from != to && _users[tokenId].user != address(0)) {
            delete _users[tokenId];
            emit UpdateUser(tokenId, address(0), 0);
        }
    }
}