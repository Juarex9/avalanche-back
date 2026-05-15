// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title EIP712
/// @notice Library for EIP-712 typed data hashing (no recovery — use OpenZeppelin ECDSA in the vault).
library EIP712 {
    /// @dev EIP-712 domain separator typehash:
    /// keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
    bytes32 internal constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    /// @dev Transfer message typehash:
    /// keccak256("Transfer(address bank,address beneficiary,uint256 amount,bytes32 commitment,uint256 bankNonce,uint256 expiry)")
    bytes32 internal constant TRANSFER_TYPEHASH = keccak256(
        "Transfer(address bank,address beneficiary,uint256 amount,bytes32 commitment,uint256 bankNonce,uint256 expiry)"
    );

    function _domainSeparator(string memory name, string memory version, uint256 chainId, address verifyingContract)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(
            abi.encode(DOMAIN_TYPEHASH, keccak256(bytes(name)), keccak256(bytes(version)), chainId, verifyingContract)
        );
    }

    function _hashTransfer(
        address bank,
        address beneficiary,
        uint256 amount,
        bytes32 commitment,
        uint256 bankNonce,
        uint256 expiry
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(TRANSFER_TYPEHASH, bank, beneficiary, amount, commitment, bankNonce, expiry));
    }

    function _hashTypedDataV4(
        string memory name,
        string memory version,
        uint256 chainId,
        address verifyingContract,
        address bank,
        address beneficiary,
        uint256 amount,
        bytes32 commitment,
        uint256 bankNonce,
        uint256 expiry
    ) internal pure returns (bytes32) {
        bytes32 domainSeparator = _domainSeparator(name, version, chainId, verifyingContract);
        bytes32 structHash = _hashTransfer(bank, beneficiary, amount, commitment, bankNonce, expiry);

        return keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));
    }
}
