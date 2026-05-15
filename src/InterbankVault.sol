// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EIP712} from "./libraries/EIP712.sol";

/// @title InterbankVault
/// @notice Escrow contract for AVAX interbank transfers with EIP-712 authorization.
/// @dev Signatures verified with OpenZeppelin ECDSA (low-s, v ∈ {27,28}). Beneficiary must be able to receive native AVAX on `release` (push transfer).
contract InterbankVault {
    // --- Custom errors ---
    error ZeroSafeAddress();
    error ValueMismatch();
    error TransferExpired();
    error ZeroBank();
    error ZeroBeneficiary();
    error ZeroAmount();
    error NonceMismatch();
    error InvalidSignature();
    error OnlyFinNovaSafe();
    error InvalidTransferState();
    error BeneficiaryMismatch();
    error NativeTransferFailed();
    error NotExpired();
    error NotDepositor();
    error NativeRefundFailed();

    enum State {
        None,
        Opened,
        Released,
        Refunded
    }

    struct Transfer {
        bytes32 transferId;
        address bank;
        address beneficiary;
        address payable depositor;
        uint256 amount;
        bytes32 commitment;
        uint256 bankNonce;
        uint256 expiry;
        State state;
    }

    event TransferOpened(
        bytes32 indexed transferId,
        address indexed bank,
        address indexed beneficiary,
        uint256 amount,
        bytes32 commitment,
        uint256 expiry
    );

    event TransferReleased(bytes32 indexed transferId, address indexed to, uint256 amount);

    event TransferRefunded(bytes32 indexed transferId, address indexed to, uint256 amount);

    address public immutable finNovaSafe;

    /// @notice CNBV view key material (MVP: one word; full 65-byte pubkey can be split or kept off-chain).
    bytes32 public immutable cnbvViewPubKey;

    string public constant EIP712_NAME = "InterbankVault";
    string public constant EIP712_VERSION = "1";

    mapping(bytes32 => Transfer) public transfers;
    mapping(address => uint256) public bankNonces;

    constructor(address _finNovaSafe, bytes32 _cnbvViewPubKey) {
        if (_finNovaSafe == address(0)) revert ZeroSafeAddress();
        finNovaSafe = _finNovaSafe;
        cnbvViewPubKey = _cnbvViewPubKey;
    }

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
        if (msg.value != amount) revert ValueMismatch();
        if (expiry <= block.timestamp) revert TransferExpired();
        if (bank == address(0)) revert ZeroBank();
        if (beneficiary == address(0)) revert ZeroBeneficiary();
        if (amount == 0) revert ZeroAmount();
        if (bankNonces[bank] != bankNonce) revert NonceMismatch();

        bytes32 digest = EIP712._hashTypedDataV4(
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

        (address signer, ECDSA.RecoverError err,) = ECDSA.tryRecover(digest, v, r, s);
        if (err != ECDSA.RecoverError.NoError || signer != bank) revert InvalidSignature();

        bankNonces[bank] = bankNonce + 1;

        bytes32 transferId = keccak256(abi.encodePacked(digest, bank, bankNonce));

        transfers[transferId] = Transfer({
            transferId: transferId,
            bank: bank,
            beneficiary: beneficiary,
            depositor: payable(msg.sender),
            amount: amount,
            commitment: commitment,
            bankNonce: bankNonce,
            expiry: expiry,
            state: State.Opened
        });

        emit TransferOpened(transferId, bank, beneficiary, amount, commitment, expiry);
    }

    function release(bytes32 transferId, address payable to) external {
        if (msg.sender != finNovaSafe) revert OnlyFinNovaSafe();

        Transfer storage t = transfers[transferId];
        if (t.state != State.Opened) revert InvalidTransferState();
        if (to != t.beneficiary) revert BeneficiaryMismatch();

        t.state = State.Released;

        (bool success,) = to.call{value: t.amount}("");
        if (!success) revert NativeTransferFailed();

        emit TransferReleased(transferId, to, t.amount);
    }

    function refund(bytes32 transferId) external {
        Transfer storage t = transfers[transferId];

        if (t.state != State.Opened) revert InvalidTransferState();
        if (block.timestamp <= t.expiry) revert NotExpired();
        if (msg.sender != t.depositor) revert NotDepositor();

        t.state = State.Refunded;

        (bool success,) = t.depositor.call{value: t.amount}("");
        if (!success) revert NativeRefundFailed();

        emit TransferRefunded(transferId, t.depositor, t.amount);
    }

    function getTransferState(bytes32 transferId) external view returns (State) {
        return transfers[transferId].state;
    }

    function getTransfer(bytes32 transferId)
        external
        view
        returns (bytes32, address, address, address, uint256, bytes32, uint256, uint256, State)
    {
        Transfer storage t = transfers[transferId];
        return
            (t.transferId, t.bank, t.beneficiary, t.depositor, t.amount, t.commitment, t.bankNonce, t.expiry, t.state);
    }
}
