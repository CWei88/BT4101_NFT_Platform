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

    function mint(string memory tokenURI, address mpContract) public {
        tokenIds.increment();
        uint256 newTokenId = tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        setApprovalForAll(mpContract, true);
        emit MintNFT(newTokenId);
    }
}