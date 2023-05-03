//Sample ERC-721 NFT code used to test individual NFT

pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract BasicNFT is ERC721 { 
    string public constant TOKEN_URI = "ipfs://QmSgCmQVnoqLCxEgjCuo17MFePcxdHUTLjTK2BBWAehAhU";
    uint256 private s_tokenCounter;

    event Minted(uint256 indexed tokenId);

    constructor() ERC721("newNFT", "FTX") {
        s_tokenCounter = 0;
    }

    function mintNFT() public {
        _safeMint(msg.sender, s_tokenCounter);
        emit Minted(s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for non-existent token");
        return TOKEN_URI;
    }

    function getTokenCounter() public view returns(uint256) {
        return s_tokenCounter;
    }
}