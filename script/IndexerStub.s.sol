// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";

/// @title IndexerStub
/// @notice Read-only script that helps query TransferOpened events from InterbankVault on Fuji.
///         Provides cast commands for event inspection and commitment verification helpers.
///         CNBV uses this to collect events for decryption and audit.
/// @dev Foundry scripts cannot call RPC directly; use the provided cast commands or run via anvil with a forked state.
contract IndexerStubScript is Script {
    /// @notice RPC URL for Avalanche Fuji testnet.
    string constant FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";

    /// @notice Represents a parsed TransferOpened event.
    struct TransferEvent {
        bytes32 transferId;
        address bank;
        address beneficiary;
        uint256 amount;
        bytes32 commitment;
        uint256 expiry;
        uint256 blockNumber;
        bytes32 blockHash;
        bytes32 txHash;
    }

    function run() external {
        address vaultAddress = vm.envAddress("INDEXER_VAULT_ADDRESS");
        uint256 fromBlock = vm.envUint("INDEXER_FROM_BLOCK");

        console.log("=== InterbankVault Indexer Stub ===");
        console.log("Vault address:", vaultAddress);
        console.log("RPC:", FUJI_RPC);
        console.log("From block:", fromBlock);
        console.log("");
        console.log("NOTE: Foundry scripts cannot call RPC eth_getLogs directly.");
        console.log("      Use the cast commands below or an anvil fork with eth_getLogs.");
        console.log("");
        console.log("--- cast commands for manual event query ---");
        console.log(getCastLogsCommand(vaultAddress, fromBlock));
        console.log("");
        console.log("--- Verify a commitment ---");
        console.log("Use verifyCommitment(payload, onChainCommitment) with your decrypted payload.");
    }

    /// @notice Returns the cast command string to query TransferOpened events.
    /// @param vaultAddress The deployed InterbankVault contract address.
    /// @param fromBlock The starting block number to query from.
    /// @return cmd The full cast command for event inspection.
    function getCastLogsCommand(address vaultAddress, uint256 fromBlock) public pure returns (string memory cmd) {
        cmd = string.concat(
            "cast logs --rpc-url ",
            FUJI_RPC,
            " --from-block ",
            vm.toString(fromBlock),
            " --to-block latest",
            " --address ",
            vm.toString(vaultAddress),
            " TransferOpened(bytes32,address,address,uint256,bytes32,uint256)"
        );
    }

    /// @notice Verifies a commitment by hashing the original payload and comparing
    ///         to the on-chain commitment hash.
    /// @param originalPayload The original payload that was committed (e.g. abi.encode(...))
    /// @param onChainCommitment The bytes32 commitment stored on-chain in the TransferOpened event.
    /// @return True if keccak256(originalPayload) == onChainCommitment.
    function verifyCommitment(bytes memory originalPayload, bytes32 onChainCommitment) external pure returns (bool) {
        return keccak256(originalPayload) == onChainCommitment;
    }

    /// @notice Computes an example commitment hash for a structured payload.
    ///         CNBV should replace this with their own payload structure.
    /// @param bank The bank address.
    /// @param beneficiary The beneficiary address.
    /// @param amount The transfer amount in wei.
    /// @param cnbvCiphertext The CNBV ciphertext (hex string or raw bytes).
    /// @param bankNonce The bank's current nonce.
    /// @param expiry The expiry timestamp.
    /// @return commitment The computed keccak256 commitment hash.
    function computeCommitment(
        address bank,
        address beneficiary,
        uint256 amount,
        bytes memory cnbvCiphertext,
        uint256 bankNonce,
        uint256 expiry
    ) external pure returns (bytes32 commitment) {
        commitment = keccak256(abi.encode(bank, beneficiary, amount, keccak256(cnbvCiphertext), bankNonce, expiry));
    }

    /// @notice Parses raw event data for a TransferOpened log entry.
    ///         Use this when you have raw logs and need to extract fields.
    /// @param data The raw non-indexed data from the event (amount, commitment, expiry as 3 words).
    /// @return amount The transfer amount in wei.
    /// @return commitment The CNBV commitment hash.
    /// @return expiry The expiry timestamp.
    function parseEventData(bytes memory data)
        internal
        pure
        returns (uint256 amount, bytes32 commitment, uint256 expiry)
    {
        // Layout for TransferOpened(bytes32 indexed transferId, address indexed bank,
        //                           address indexed beneficiary, uint256 amount,
        //                           bytes32 commitment, uint256 expiry)
        // Indexed fields (transferId, bank, beneficiary) appear as topics[1-3].
        // Non-indexed data: amount (0:32), commitment (32:64), expiry (64:96)
        assembly {
            amount := mload(add(data, 0x20))
            commitment := mload(add(data, 0x40))
            expiry := mload(add(data, 0x60))
        }
    }

    /// @notice Prints a TransferEvent as formatted JSON.
    ///         Output format matches what CNBV's decryption pipeline expects.
    function printEventAsJson(TransferEvent memory e) external pure {
        console.log("{");
        console.log('  "transferId": "', vm.toString(e.transferId), '",');
        console.log('  "bank": "', vm.toString(e.bank), '",');
        console.log('  "beneficiary": "', vm.toString(e.beneficiary), '",');
        console.log('  "amount": ', e.amount, ",");
        console.log('  "commitment": "', vm.toString(e.commitment), '",');
        console.log('  "expiry": ', e.expiry, ",");
        console.log('  "blockNumber": ', e.blockNumber, ",");
        console.log('  "blockHash": "', vm.toString(e.blockHash), '",');
        console.log('  "txHash": "', vm.toString(e.txHash), '"');
        console.log("}");
    }

    /// @notice Returns example cast call to read the vault's domain separator.
    ///         Useful for off-chain signature verification.
    function getDomainSeparatorCommand(address vaultAddress) external pure returns (string memory) {
        return
            string.concat("cast call ", vm.toString(vaultAddress), " 'EIP712_DOMAIN_SEPARATOR()' --rpc-url ", FUJI_RPC);
    }

    /// @notice Returns example cast call to read a transfer's full data.
    /// @param transferId The transfer ID to look up.
    /// @return cmd The cast command to call getTransfer(transferId).
    function getTransferCommand(address vaultAddress, bytes32 transferId) external pure returns (string memory cmd) {
        cmd = string.concat(
            "cast call ",
            vm.toString(vaultAddress),
            " 'getTransfer(bytes32)' ",
            vm.toString(transferId),
            " --rpc-url ",
            FUJI_RPC
        );
    }
}
