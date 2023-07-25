// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

abstract contract Verifier {
    bytes32 public DOMAIN_SEPARATOR;
    bytes32 public constant WITHDRAW_TYPEHASH =
        keccak256("Withdraw(uint256 taskId,uint256 amount,uint256 deadline)");

    constructor() {
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256(
                    "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
                ),
                // This should match the domain you set in your client side signing.
                keccak256(bytes("Task")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function recoverWithdraw(
        uint _taskId,
        uint _amount,
        uint deadline,
        bytes memory _signature
    ) internal view returns (address signAddr) {
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(_signature, 0x20))
            s := mload(add(_signature, 0x40))
            v := byte(0, mload(add(_signature, 0x60)))
        }
        bytes32 structHash = keccak256(
            abi.encode(WITHDRAW_TYPEHASH, _taskId, _amount, deadline)
        );
        return recoverVerify(structHash, v, r, s);
    }

    function recoverVerify(
        bytes32 structHash,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (address signAddr) {
        bytes32 digest = ECDSA.toTypedDataHash(DOMAIN_SEPARATOR, structHash);
        signAddr = ECDSA.recover(digest, v, r, s);
    }
}
