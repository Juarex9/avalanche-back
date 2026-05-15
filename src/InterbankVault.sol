// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {EIP712} from "./libraries/EIP712.sol";

/// @title InterbankVault
/// @notice Escrow contract for AVAX interbank transfers with EIP-712 authorization.
/// Banks open transfers by sending AVAX with a valid EIP-712 signature.
/// FinNova's Gnosis Safe releases funds to beneficiaries.
/// Banks can refund after transfer expiry.
contract InterbankVault {
    /// @notice Possible states of a transfer.
    enum State {
        None,   // transfer does not exist
        Opened, // AVAX received, awaiting release or refund
        Released,
        Refunded
    }

    /// @notice Transfer data structure.
    struct Transfer {
        bytes32 transferId;
        address bank;
        address beneficiary;
        uint256 amount;
        bytes32 commitment;
        uint256 bankNonce;
        uint256 expiry;
        State state;
    }

    /// @notice Emitted when a bank opens a transfer.
    event TransferOpened(
        bytes32 indexed transferId,
        address indexed bank,
        address indexed beneficiary,
        uint256 amount,
        bytes32 commitment,
        uint256 expiry
    );

    /// @notice Emitted when FinNova Safe releases funds to a beneficiary.
    event TransferReleased(
        bytes32 indexed transferId,
        address indexed to,
        uint256 amount
    );

    /// @notice Emitted when a bank refunds after expiry.
    event TransferRefunded(
        bytes32 indexed transferId,
        address indexed to,
        uint256 amount
    );

    /// @notice Address of the Gnosis Safe that alone can call `release`.
    /// Immutable after construction.
    address public immutable finNovaSafe;

    /// @notice CNBV public view key (SECP256k1 uncompressed 65 bytes) for audit ciphertext.
    /// Immutable after construction.
    bytes32 public immutable cnbvViewPubKey;

    /// @notice EIP-712 name used for domain separator.
    string public constant EIP712_NAME = "InterbankVault";

    /// @notice EIP-712 version used for domain separator.
    string public constant EIP712_VERSION = "1";

    /// @notice Maps transferId to Transfer data.
    mapping(bytes32 => Transfer) public transfers;

    /// @notice Maps each bank address to its current nonce.
    /// Nonces prevent EIP-712 signature replay attacks.
    mapping(address => uint256) public bankNonces;

    /// @notice Creates a new InterbankVault.
    /// @param _finNovaSafe The Gnosis Safe address authorized to release funds.
    /// @param _cnbvViewPubKey The CNBV view public key for audit verification.
    constructor(address _finNovaSafe, bytes32 _cnbvViewPubKey) {
        require(_finNovaSafe != address(0), "InterbankVault: zero safe address");
        finNovaSafe = _finNovaSafe;
        cnbvViewPubKey = _cnbvViewPubKey;
    }

    /// @notice Opens a new transfer by receiving AVAX with EIP-712 authorization.
    ///
    /// Requirements:
    /// - `msg.value` must equal `amount`
    /// - `expiry` must be in the future
    /// - Signature must be valid and signed by `bank`
    /// - `bankNonce` must match the bank's current nonce (anti-replay)
    ///
    /// Effects:
    /// - Increments bank's nonce
    /// - Creates Transfer with state Opened
    /// - Emits TransferOpened
    ///
    /// @param bank The bank initiating the transfer (signer).
    /// @param beneficiary The final recipient of the AVAX on release.
    /// @param amount The amount of AVAX to escrow.
    /// @param commitment The CNBV audit commitment hash.
    /// @param bankNonce The bank's current nonce for this transfer.
    /// @param expiry The block timestamp after which refund is allowed.
    /// @param v EIP-712 signature v component.
    /// @param r EIP-712 signature r component.
    /// @param s EIP-712 signature s component.
    function openTransfer(
        address bank,
        address beneficiary,
        uint256 amount,
        bytes32 commitment,
        uint256 bankNonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external payable {
        // --- Checks ---
        require(msg.value == amount, "InterbankVault: value mismatch");
        require(expiry > block.timestamp, "InterbankVault: expired");
        require(bank != address(0), "InterbankVault: zero bank");
        require(beneficiary != address(0), "InterbankVault: zero beneficiary");
        require(amount > 0, "InterbankVault: zero amount");

        // Verify nonce matches current bank nonce
        require(bankNonces[bank] == bankNonce, "InterbankVault: nonce mismatch");

        // Recover signer from EIP-712 signature
        address signer = EIP712.recoverSigner(
            EIP712_NAME,
            EIP712_VERSION,
            block.chainid,
            address(this),
            bank,
            beneficiary,
            amount,
            commitment,
            bankNonce,
            expiry,
            v,
            r,
            s
        );

        require(signer == bank, "InterbankVault: invalid signature");

        // --- Effects ---
        // Increment nonce BEFORE storage update (prevent reentrancy on nonce)
        bankNonces[bank] = bankNonce + 1;

        // Compute transferId: keccak256(abi.encodePacked(openHash, bank, nonce))
        // openHash is the EIP-712 digest computed above
        bytes32 openDigest = EIP712._hashTypedDataV4(
            EIP712_NAME,
            EIP712_VERSION,
            block.chainid,
            address(this),
            bank,
            beneficiary,
            amount,
            commitment,
            bankNonce,
            expiry
        );

        bytes32 transferId = keccak256(abi.encodePacked(openDigest, bank, bankNonce));

        // Store transfer
        transfers[transferId] = Transfer({
            transferId: transferId,
            bank: bank,
            beneficiary: beneficiary,
            amount: amount,
            commitment: commitment,
            bankNonce: bankNonce,
            expiry: expiry,
            state: State.Opened
        });

        emit TransferOpened(transferId, bank, beneficiary, amount, commitment, expiry);
    }

    /// @notice Releases escrowed AVAX to the beneficiary.
    /// Can only be called by the FinNova Gnosis Safe.
    ///
    /// Requirements:
    /// - `msg.sender` must equal `finNovaSafe`
    /// - Transfer must exist and be in Opened state
    ///
    /// Effects (CEI pattern):
    /// - Mark transfer as Released BEFORE sending AVAX
    /// @param transferId The ID of the transfer to release.
    /// @param to The address to send the AVAX (must match stored beneficiary in MVP,
    ///            but `to` param allows flexibility; in MVP `to == beneficiary`).
    function release(bytes32 transferId, address payable to) external {
        require(msg.sender == finNovaSafe, "InterbankVault: only finNovaSafe");

        Transfer storage t = transfers[transferId];
        require(t.state == State.Opened, "InterbankVault: not opened");
        require(to != address(0), "InterbankVault: zero address");

        // --- Effects (CEI) ---
        // Mark as Released before interaction
        t.state = State.Released;

        // --- Interactions ---
        // Send AVAX to the specified address
        // Using low-level call to handle potential gas edge cases
        (bool success, ) = to.call{value: t.amount}("");
        require(success, "InterbankVault: transfer failed");

        emit TransferReleased(transferId, to, t.amount);
    }

    /// @notice Refunds escrowed AVAX to the bank after expiry.
    ///
    /// Requirements:
    /// - `msg.sender` must be the original bank
    /// - Transfer must be in Opened state
    /// - Current block timestamp must be after expiry
    ///
    /// Effects (CEI pattern):
    /// - Mark transfer as Refunded BEFORE returning AVAX
    /// @param transferId The ID of the transfer to refund.
    function refund(bytes32 transferId) external {
        Transfer storage t = transfers[transferId];

        require(t.state == State.Opened, "InterbankVault: not opened");
        require(block.timestamp > t.expiry, "InterbankVault: not expired");
        require(msg.sender == t.bank, "InterbankVault: not bank");

        // --- Effects (CEI) ---
        // Mark as Refunded before interaction
        t.state = State.Refunded;

        // --- Interactions ---
        // Return AVAX to the bank
        (bool success, ) = t.bank.call{value: t.amount}("");
        require(success, "InterbankVault: refund failed");

        emit TransferRefunded(transferId, t.bank, t.amount);
    }

    /// @notice Returns the current state of a transfer.
    /// @param transferId The ID of the transfer.
    /// @return The State enum value.
    function getTransferState(bytes32 transferId) external view returns (State) {
        return transfers[transferId].state;
    }

    /// @notice Returns the Transfer struct data for a given transferId.
    /// @param transferId The ID of the transfer.
    /// @return All fields of the Transfer struct.
    function getTransfer(bytes32 transferId) external view returns (
        bytes32,
        address,
        address,
        uint256,
        bytes32,
        uint256,
        uint256,
        State
    ) {
        Transfer storage t = transfers[transferId];
        return (
            t.transferId,
            t.bank,
            t.beneficiary,
            t.amount,
            t.commitment,
            t.bankNonce,
            t.expiry,
            t.state
        );
    }
}