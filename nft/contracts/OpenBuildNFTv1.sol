// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract OpenBuildNFTv1 is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;
    using Counters for Counters.Counter;

    Counters.Counter private _tokenCounter;

    string constant _nftName = "OpenBuildNFT";
    string constant _nftSymbol = "OBT";

    string private _baseTokenURI =
        "https://s3.us-west-1.amazonaws.com/file.openbuild.xyz/metadata/";
    address public _msgSigner = 0x877B5C8132C7c2c3B920095793CAED3a6c5EB830;

    // token id == nft id
    mapping(uint256 => uint256) public counterToUserId;
    mapping(uint256 => uint256) public counterToTokenId;
    mapping(uint256 => uint256) public tokenIdToCounter;
    mapping(uint256 => string) public tokenIdToImgUrl;

    // Reentrancy guard modifier
    bool private _locked = false;
    modifier nonReentrant() {
        require(!_locked, "No re-entrant call.");
        _locked = true;
        _;
        _locked = false;
    }

    event Mint(address indexed to, uint256 indexed tokenId);

    constructor() ERC721(_nftName, _nftSymbol) {}

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string calldata newBaseTokenURI) external onlyOwner {
        _baseTokenURI = newBaseTokenURI;
    }

    function _getMsgSigner() internal view returns (address) {
        return _msgSigner;
    }

    function setMsgSigner(address newMsgSigner) external onlyOwner {
        _msgSigner = newMsgSigner;
    }

    function getTokenCounter() public view returns (uint256) {
        return _tokenCounter.current();
    }

    function getTokenIdByCounter(uint256 input_counter) public view returns (uint256) {
        return counterToTokenId[input_counter];
    }

    function getUserIdByCounter(uint256 input_counter) public view returns (uint256) {
        return counterToUserId[input_counter];
    }

    function getCounterByTokenId(uint256 input_token_id) public view returns (uint256) {
        return tokenIdToCounter[input_token_id];
    }

    function getImgUrlByTokenId(uint256 input_token_id) public view returns (string memory) {
        return tokenIdToImgUrl[input_token_id];
    }

    // json url
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        require(tokenId <= _tokenCounter.current(), "Token Not Exist.");
        return super.tokenURI(tokenId);
    }

    function validateSignature(bytes32 _hash, bytes memory _signature) public view returns (bool) {
        return ECDSA.recover(_hash, _signature) == _msgSigner;
    }

    function safeMint(
        address to,
        uint256 nftId,
        uint256 userId,
        string memory imgUrl,
        bytes32 message,
        bytes memory signature
    ) public nonReentrant {
        require(validateSignature(message, signature), "Signature validation failed");

        uint256 _counter = _tokenCounter.current();
        counterToUserId[_counter] = userId;
        counterToTokenId[_counter] = nftId;
        tokenIdToCounter[nftId] = _counter;
        tokenIdToImgUrl[nftId] = imgUrl;

        // token counter start from zero
        _tokenCounter.increment();

        _safeMint(to, _counter);
        _setTokenURI(_counter, Strings.toString(nftId));
    }

    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) onlyOwner {
        super._burn(tokenId);
    }

    // transfer disabled
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721)
    {
        require(from == address(0), "Token not transferable");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function contractAddress() internal view returns (string memory) {
        return Strings.toHexString(uint160(address(this)), 20);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
