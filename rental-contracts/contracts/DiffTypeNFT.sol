pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DiffTypeNFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;
    address marketplaceContract;

    event MintNFT(uint256 tokenId);

    constructor () ERC721("Diff Type NFT", "DNFT") {}

    function mint(address _to, string memory tokenURI) public {
        tokenIds.increment();
        uint256 newTokenId = tokenIds.current();
        _safeMint(_to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        emit MintNFT(newTokenId);
    }

    function approveUser(address user) public {
        setApprovalForAll(user, true);
    }
}