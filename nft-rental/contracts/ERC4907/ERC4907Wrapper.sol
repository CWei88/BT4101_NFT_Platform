pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./ERC4907.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

contract ERC4907Wrapper is ERC4907, IERC721Receiver {

    address internal _tokenAddress;
    address internal originalOwner;

    event TokenWrapped(address nftAddress, uint256 tokenId);

    event TokenUnWrapped(address nftAddress, uint256 tokenId);

    constructor(address nftAddress, string memory _name, string memory _symbol) ERC4907(_name, _symbol) {
        _tokenAddress = nftAddress;
    }

    function onERC721Received(address operator, address from, uint tokenId, bytes calldata data) public virtual override returns(bytes4)  {
        return this.onERC721Received.selector;
    }

    function getTokenAddress() public view returns (address) {
        return _tokenAddress;
    }

    function wrapToken(uint256 tokenId) public virtual{
        address owner = IERC721(_tokenAddress).ownerOf(tokenId);
        require(owner == msg.sender, "Only owner can call this");
        originalOwner = owner;

        ERC721(_tokenAddress).safeTransferFrom(msg.sender, address(this), tokenId);
        _safeMint(msg.sender, tokenId);

        emit TokenWrapped(_tokenAddress, tokenId);
    }

    function unwrapToken(uint256 tokenId) public virtual{
        address owner = IERC721(_tokenAddress).ownerOf(tokenId);
        require(_isApprovedOrOwner(msg.sender, tokenId), "Only owner can unwrap");
        require(owner == address(this), "No wrapped tokenId found");

        _burn(tokenId);
        ERC721(_tokenAddress).safeTransferFrom(address(this), _msgSender(), tokenId);

        emit TokenUnWrapped(_tokenAddress, tokenId);
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