pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract Token is ERC721URIStorage, Ownable{
    uint private tokenCount;
    constructor() ERC721 ("Test", "TEST"){
        tokenCount = 0;
    }

    function mintNFT(address owner, string memory tokenURI) public onlyOwner returns (uint256) {
        tokenCount += 1;

        uint256 tokenId = tokenCount;
        _mint(owner, tokenId);
        _setTokenURI(tokenId, tokenURI);

        return tokenId;
    }
}