//ERC-4907 NFT generator
pragma solidity >=0.8.0 <0.9.0;

import './ERC4907/ERC4907.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import "@openzeppelin/contracts/utils/Counters.sol";

contract RentableNFT is ERC4907 {
    using Counters for Counters.Counter;
    Counters.Counter private tokenIds;

    modifier onlyOwner(uint256 _tokenId) {
        require(_isApprovedOrOwner(msg.sender, _tokenId), "ERC721: Caller is not owner or approved");
        _;
    }

    mapping(uint256 => string) public tokenURIs;

    constructor (string memory _name, string memory _symbol) ERC4907(_name, _symbol) {}

    function mint(address to, string memory _tokenURI) public { 
        tokenIds.increment();
        uint256 currTokenId = tokenIds.current();
        _safeMint(to, currTokenId);
        tokenURIs[currTokenId] = _tokenURI;
    }

    function rent(uint256 _tokenId, address _user, uint64 _expires) public onlyOwner(_tokenId) {
        setUser(_tokenId, _user, _expires);
    }

    function tokenURI(uint256 _tokenId) public view override returns(string memory) {
        return tokenURIs[_tokenId];
    }

    function approveUser(address user) public {
        setApprovalForAll(user, true);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public virtual override {
        super.safeTransferFrom(from, to, tokenId);
    }
    
}