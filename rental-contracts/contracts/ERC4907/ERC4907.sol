// SPDX-License-Identifier: CC0-1.0
// Modified ERC-4907 code retrieved from EIP Protocol. Retrieved from: https://eips.ethereum.org/EIPS/eip-4907
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./IERC4907.sol";

contract ERC4907 is ERC721, IERC4907 {
    struct UserInfo
    {
        address user;   // address of user role
        uint64 expires; // unix timestamp, user expires
    }

    struct tokenInfo {
        uint256 tokenId;
        uint64 expires;
    }

    mapping (uint256  => UserInfo) internal _users;

    mapping (address => tokenInfo[]) private _userBalance;

    constructor(string memory name_, string memory symbol_)
     ERC721(name_,symbol_)
     {}

    /// @notice set the user and _expires of a NFT
    /// @dev The zero address indicates there is no user
    /// Throws if `tokenId` is not valid NFT
    /// @param user  The new user of the NFT
    /// @param expires  UNIX timestamp, The new user could use the NFT before expires
    function setUser(uint256 tokenId, address user, uint64 expires) public virtual{
        require(_isApprovedOrOwner(msg.sender, tokenId),"ERC721: transfer caller is not owner nor approved");
        UserInfo storage info =  _users[tokenId];
        info.user = user;
        info.expires = expires;
        
        tokenInfo memory tInfo = tokenInfo(tokenId, expires);
        _userBalance[user].push(tInfo);
        emit UpdateUser(tokenId,user,expires);
    }

    /// @notice Get the user address of an NFT
    /// @dev The zero address indicates that there is no user or the user is expired
    /// @param tokenId The NFT to get the user address for
    /// @return The user address for this NFT
    function userOf(uint256 tokenId)public view virtual returns(address){
        if( uint256(_users[tokenId].expires) >=  block.timestamp){
            return  _users[tokenId].user;
        }
        else{
            return address(0);
        }
    }

    /// @notice Get the user expires of an NFT
    /// @dev The zero value indicates that there is no user
    /// @param tokenId The NFT to get the user expires for
    /// @return The user expires for this NFT
    function userExpires(uint256 tokenId) public view virtual returns(uint256){
        return _users[tokenId].expires;
    }

    /// @dev See {IERC165-supportsInterface}.
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC4907).interfaceId || super.supportsInterface(interfaceId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override{
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        if (from != to && _users[tokenId].user != address(0)) {
            delete _users[tokenId];
            emit UpdateUser(tokenId, address(0), 0);
        }
    }

    function balanceOf(address owner) public view virtual override returns(uint256) {
        require(owner != address(0), "ERC721: address zero is not a valid owner");
        uint256 ownerTokens = super.balanceOf(owner);
        uint numNFT = _userBalance[owner].length;
        uint256 userTokens = 0;
        for (uint i=0; i < numNFT; i++) {
            tokenInfo memory curr = _userBalance[owner][i];
            if (curr.expires >= block.timestamp) {
                userTokens += 1;
            }
        }

        uint256 totalTokens = ownerTokens + userTokens;
        return totalTokens;
    }

    function tokenOfOwnerByIndex(address owner, uint256 index) public view virtual returns(uint256) {
        require(index < ERC4907.balanceOf(owner), "ERC4907: Index out of bounds");
        uint ownedTokens = super.balanceOf(owner);

        if (index < ownedTokens) {
            return ERC721Enumerable(owner).tokenOfOwnerByIndex(owner, index);
        } else {
            uint userIndex= index - ownedTokens;
            return _userBalance[owner][userIndex].tokenId;
        }

    }
}