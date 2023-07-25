//SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDT is ERC20 {
    constructor() ERC20("USDT", "USDT") {
        _mint(msg.sender, 10000000000 * 10 ** 6);
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}