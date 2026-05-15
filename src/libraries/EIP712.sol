// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title EIP712
/// @notice Library for EIP-712 typed data hashing and signature recovery.
/// @dev Used by InterbankVault to verify bank signatures on transfer intents.
library EIP712 {
    /// @dev EIP-712 domain separator typehash:
    /// keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
    bytes32 constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    /// @dev Transfer message typehash:
    /// keccak256("Transfer(address bank,address beneficiary,uint256 amount,bytes32 commitment,uint256 bankNonce,uint256 expiry)")
    bytes32 constant TRANSFER_TYPEHASH =
        keccak256("Transfer(address bank,address beneficiary,uint256 amount,bytes32 commitment,uint256 bankNonce,uint256 expiry)");

    /// @notice Builds the domain separator for this contract.
    /// @param name The EIP-712 name string.
    /// @param version The EIP-712 version string.
    /// @param chainId The current chain ID.
    /// @param verifyingContract The address of this contract.
    /// @return The domain separator hash.
    function _domainSeparator(
        string memory name,
        string memory version,
        uint256 chainId,
        address verifyingContract
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(name)),
                keccak256(bytes(version)),
                chainId,
                verifyingContract
            )
        );
    }

    /// @notice Hashes the struct Transfer according to EIP-712 rules.
    /// @param bank The bank address.
    /// @param beneficiary The beneficiary address.
    /// @param amount The transfer amount in wei.
    /// @param commitment The commitment hash (CNBV audit payload).
    /// @param bankNonce The bank's current nonce.
    /// @param expiry The expiry block timestamp.
    /// @return The encoded struct hash.
    function _hashTransfer(
        address bank,
        address beneficiary,
        uint256 amount,
        bytes32 commitment,
        uint256 bankNonce,
        uint256 expiry
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                TRANSFER_TYPEHASH,
                bank,
                beneficiary,
                amount,
                commitment,
                bankNonce,
                expiry
            )
        );
    }

    /// @notice Hashes typed data according to EIP-712 with domain separator.
    /// @param name The EIP-712 name.
    /// @param version The EIP-712 version.
    /// @param chainId The current chain ID.
    /// @param verifyingContract The contract address.
    /// @param bank The bank signer address.
    /// @param beneficiary The beneficiary address.
    /// @param amount The transfer amount.
    /// @param commitment The commitment hash.
    /// @param bankNonce The bank's nonce.
    /// @param expiry The expiry timestamp.
    /// @return The final digest for signature verification.
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

    /// @notice Recovers the signer address from an EIP-712 signature.
    /// @param name The EIP-712 name.
    /// @param version The EIP-712 version.
    /// @param chainId The current chain ID.
    /// @param verifyingContract The contract address.
    /// @param bank The bank signer address.
    /// @param beneficiary The beneficiary address.
    /// @param amount The transfer amount.
    /// @param commitment The commitment hash.
    /// @param bankNonce The bank's nonce.
    /// @param expiry The expiry timestamp.
    /// @param v Signature v component.
    /// @param r Signature r component.
    /// @param s Signature s component.
    /// @return The recovered signer address.
    function recoverSigner(
        string memory name,
        string memory version,
        uint256 chainId,
        address verifyingContract,
        address bank,
        address beneficiary,
        uint256 amount,
        bytes32 commitment,
        uint256 bankNonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal pure returns (address) {
        bytes32 digest = _hashTypedDataV4(
            name,
            version,
            chainId,
            verifyingContract,
            bank,
            beneficiary,
            amount,
            commitment,
            bankNonce,
            expiry
        );

        return ecrecover(digest, v, r, s);
    }
}