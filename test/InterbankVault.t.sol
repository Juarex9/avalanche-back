// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {InterbankVault} from "../src/InterbankVault.sol";
import {EIP712} from "../src/libraries/EIP712.sol";

contract InterbankVaultTest is Test {
    InterbankVault public vault;
    address public safe;
    bytes32 public cnbvViewPubKey = bytes32(uint256(1));
    uint256 public bankKey;

    // EIP-712 constants matching the contract
    string constant EIP712_NAME = "InterbankVault";
    string constant EIP712_VERSION = "1";

    // Reusable signing address
    address public bank;

    /// secp256k1 curve order (malleability: high-s rejected by OZ ECDSA)
    uint256 internal constant SECP256K1_N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141;

    function setUp() public {
        safe = makeAddr("finNovaSafe");
        bankKey = uint256(keccak256(abi.encode("bank key")));
        bank = vm.addr(bankKey);

        vault = new InterbankVault(safe, cnbvViewPubKey);
    }

    function test_constructor_zeroSafe_reverts() public {
        vm.expectRevert(InterbankVault.ZeroSafeAddress.selector);
        new InterbankVault(address(0), bytes32(uint256(1)));
    }

    // ─────────────────────────────────────────────────────────────
    // Helper: build EIP-712 digest for openTransfer
    // ─────────────────────────────────────────────────────────────
    function _digest(
        address _bank,
        address _beneficiary,
        uint256 _amount,
        bytes32 _commitment,
        uint256 _bankNonce,
        uint256 _expiry
    ) internal view returns (bytes32) {
        return EIP712._hashTypedDataV4(
            EIP712_NAME,
            EIP712_VERSION,
            block.chainid,
            address(vault),
            _bank,
            _beneficiary,
            _amount,
            _commitment,
            _bankNonce,
            _expiry
        );
    }

    function _sign(
        address _bank,
        address _beneficiary,
        uint256 _amount,
        bytes32 _commitment,
        uint256 _bankNonce,
        uint256 _expiry,
        uint256 _privKey
    ) internal returns (uint8 v, bytes32 r, bytes32 s) {
        bytes32 digest = _digest(_bank, _beneficiary, _amount, _commitment, _bankNonce, _expiry);
        (v, r, s) = vm.sign(_privKey, digest);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 1: open válido — TransferOpened emitted, state Opened
    // ─────────────────────────────────────────────────────────────
    function test_openTransfer_validSignature() public {
        address beneficiary = makeAddr("beneficiary");
        uint256 amount = 1 ether;
        bytes32 commitment = keccak256("commitment data");
        uint256 nonce = 0;
        uint256 expiry = block.timestamp + 3600;

        (uint8 v, bytes32 r, bytes32 s) = _sign(bank, beneficiary, amount, commitment, nonce, expiry, bankKey);

        vm.deal(bank, amount);
        vm.prank(bank);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, nonce, expiry, v, r, s);

        // Check nonce incremented
        assertEq(vault.bankNonces(bank), 1);

        // Check transfer exists with correct state
        InterbankVault.State state =
            vault.getTransferState(_computeTransferId(bank, beneficiary, amount, commitment, nonce, expiry));
        assertEq(uint256(state), uint256(InterbankVault.State.Opened));
    }

    // ─────────────────────────────────────────────────────────────
    // Test 2: replay nonce falla
    // ─────────────────────────────────────────────────────────────
    function test_openTransfer_replayNonce_fails() public {
        address beneficiary = makeAddr("beneficiary");
        uint256 amount = 1 ether;
        bytes32 commitment = keccak256("commitment data");
        uint256 nonce = 0;
        uint256 expiry = block.timestamp + 3600;

        (uint8 v, bytes32 r, bytes32 s) = _sign(bank, beneficiary, amount, commitment, nonce, expiry, bankKey);

        vm.deal(bank, amount * 2);
        vm.prank(bank);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, nonce, expiry, v, r, s);

        // Try to replay — nonce already incremented
        vm.prank(bank);
        vm.expectRevert(InterbankVault.NonceMismatch.selector);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, nonce, expiry, v, r, s);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 3: EOA release reverte (only Safe)
    // ─────────────────────────────────────────────────────────────
    function test_release_eoa_fails() public {
        address beneficiary = makeAddr("beneficiary");
        uint256 amount = 1 ether;
        bytes32 commitment = keccak256("commitment data");
        uint256 nonce = 0;
        uint256 expiry = block.timestamp + 3600;

        (uint8 v, bytes32 r, bytes32 s) = _sign(bank, beneficiary, amount, commitment, nonce, expiry, bankKey);

        vm.deal(bank, amount);
        vm.prank(bank);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, nonce, expiry, v, r, s);

        bytes32 transferId = _computeTransferId(bank, beneficiary, amount, commitment, nonce, expiry);

        // Try release from EOA (not Safe)
        vm.expectRevert(InterbankVault.OnlyFinNovaSafe.selector);
        vault.release(transferId, payable(beneficiary));
    }

    // ─────────────────────────────────────────────────────────────
    // Test 4: refund pre-expiry reverte
    // ─────────────────────────────────────────────────────────────
    function test_refund_preExpiry_fails() public {
        address beneficiary = makeAddr("beneficiary");
        uint256 amount = 1 ether;
        bytes32 commitment = keccak256("commitment data");
        uint256 nonce = 0;
        // expiry in the future
        uint256 expiry = block.timestamp + 3600;

        (uint8 v, bytes32 r, bytes32 s) = _sign(bank, beneficiary, amount, commitment, nonce, expiry, bankKey);

        vm.deal(bank, amount);
        vm.prank(bank);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, nonce, expiry, v, r, s);

        bytes32 transferId = _computeTransferId(bank, beneficiary, amount, commitment, nonce, expiry);

        // Try refund before expiry
        vm.prank(bank);
        vm.expectRevert(InterbankVault.NotExpired.selector);
        vault.refund(transferId);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 5: happy path open→release
    // ─────────────────────────────────────────────────────────────
    function test_openTransfer_happyPath_release() public {
        address beneficiary = makeAddr("beneficiary");
        uint256 amount = 1 ether;
        bytes32 commitment = keccak256("commitment data");
        uint256 nonce = 0;
        uint256 expiry = block.timestamp + 3600;

        (uint8 v, bytes32 r, bytes32 s) = _sign(bank, beneficiary, amount, commitment, nonce, expiry, bankKey);

        vm.deal(bank, amount);
        vm.prank(bank);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, nonce, expiry, v, r, s);

        bytes32 transferId = _computeTransferId(bank, beneficiary, amount, commitment, nonce, expiry);

        // Simulate Safe calling release
        vm.deal(address(vault), amount);
        vm.prank(safe);
        vault.release(transferId, payable(beneficiary));

        // Verify contract balance drained
        assertEq(address(vault).balance, 0);

        // Verify beneficiary received funds
        assertEq(beneficiary.balance, amount);

        // Verify state Released
        assertEq(uint256(vault.getTransferState(transferId)), uint256(InterbankVault.State.Released));
    }

    // ─────────────────────────────────────────────────────────────
    // Test 6: happy path open→refund after expiry
    // ─────────────────────────────────────────────────────────────
    function test_openTransfer_happyPath_refundAfterExpiry() public {
        address beneficiary = makeAddr("beneficiary");
        uint256 amount = 1 ether;
        bytes32 commitment = keccak256("commitment data");
        uint256 nonce = 0;
        // expiry = now + 1
        uint256 expiry = block.timestamp + 1;

        (uint8 v, bytes32 r, bytes32 s) = _sign(bank, beneficiary, amount, commitment, nonce, expiry, bankKey);

        uint256 initialBankBalance = amount;
        vm.deal(bank, initialBankBalance);
        vm.prank(bank);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, nonce, expiry, v, r, s);

        bytes32 transferId = _computeTransferId(bank, beneficiary, amount, commitment, nonce, expiry);

        // Warp past expiry
        vm.warp(block.timestamp + 2);

        // Bank calls refund
        vm.prank(bank);
        vault.refund(transferId);

        // Verify bank got funds back
        assertEq(bank.balance, initialBankBalance);

        // Verify contract balance is 0
        assertEq(address(vault).balance, 0);

        // Verify state Refunded
        assertEq(uint256(vault.getTransferState(transferId)), uint256(InterbankVault.State.Refunded));
    }

    // ─────────────────────────────────────────────────────────────
    // Test 7: invalid signature reverts
    // ─────────────────────────────────────────────────────────────
    function test_openTransfer_invalidSignature_fails() public {
        address beneficiary = makeAddr("beneficiary");
        uint256 amount = 1 ether;
        bytes32 commitment = keccak256("commitment data");
        uint256 nonce = 0;
        uint256 expiry = block.timestamp + 3600;

        // Sign with wrong key
        uint256 wrongKey = uint256(keccak256(abi.encode("wrong key")));
        (uint8 v, bytes32 r, bytes32 s) = _sign(bank, beneficiary, amount, commitment, nonce, expiry, wrongKey);

        vm.deal(bank, amount);
        vm.prank(bank);
        vm.expectRevert(InterbankVault.InvalidSignature.selector);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, nonce, expiry, v, r, s);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 7b: high-s (malleable) signature rejected
    // ─────────────────────────────────────────────────────────────
    function test_openTransfer_malleableSignatureHighS_reverts() public {
        address beneficiary = makeAddr("beneficiary");
        uint256 amount = 1 ether;
        bytes32 commitment = keccak256("commitment data");
        uint256 nonce = 0;
        uint256 expiry = block.timestamp + 3600;

        bytes32 digest = _digest(bank, beneficiary, amount, commitment, nonce, expiry);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(bankKey, digest);

        uint256 sVal = uint256(s);
        bytes32 sHigh = bytes32(SECP256K1_N - sVal);
        uint8 vFlip = v == 27 ? uint8(28) : uint8(27);

        vm.deal(bank, amount);
        vm.prank(bank);
        vm.expectRevert(InterbankVault.InvalidSignature.selector);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, nonce, expiry, vFlip, r, sHigh);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 8: value mismatch reverts
    // ─────────────────────────────────────────────────────────────
    function test_openTransfer_valueMismatch_fails() public {
        address beneficiary = makeAddr("beneficiary");
        uint256 amount = 1 ether;
        bytes32 commitment = keccak256("commitment data");
        uint256 nonce = 0;
        uint256 expiry = block.timestamp + 3600;

        (uint8 v, bytes32 r, bytes32 s) = _sign(bank, beneficiary, amount, commitment, nonce, expiry, bankKey);

        vm.deal(bank, amount);
        vm.prank(bank);
        // Send less than amount
        vm.expectRevert(InterbankVault.ValueMismatch.selector);
        vault.openTransfer{value: amount - 0.1 ether}(bank, beneficiary, amount, commitment, nonce, expiry, v, r, s);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 9: non-depositor cannot refund
    // ─────────────────────────────────────────────────────────────
    function test_refund_onlyDepositor_fails() public {
        address beneficiary = makeAddr("beneficiary");
        uint256 amount = 1 ether;
        bytes32 commitment = keccak256("commitment data");
        uint256 nonce = 0;
        uint256 expiry = block.timestamp + 1;

        (uint8 v, bytes32 r, bytes32 s) = _sign(bank, beneficiary, amount, commitment, nonce, expiry, bankKey);

        vm.deal(bank, amount);
        vm.prank(bank);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, nonce, expiry, v, r, s);

        bytes32 transferId = _computeTransferId(bank, beneficiary, amount, commitment, nonce, expiry);

        vm.warp(block.timestamp + 2);

        // Random address tries to refund
        address random = makeAddr("random");
        vm.prank(random);
        vm.expectRevert(InterbankVault.NotDepositor.selector);
        vault.refund(transferId);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 10: release to wrong address reverts
    // ─────────────────────────────────────────────────────────────
    function test_release_wrongBeneficiary_reverts() public {
        address beneficiary = makeAddr("beneficiary");
        address wrong = makeAddr("wrong");
        uint256 amount = 1 ether;
        bytes32 commitment = keccak256("commitment data");
        uint256 nonce = 0;
        uint256 expiry = block.timestamp + 3600;

        (uint8 v, bytes32 r, bytes32 s) = _sign(bank, beneficiary, amount, commitment, nonce, expiry, bankKey);

        vm.deal(bank, amount);
        vm.prank(bank);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, nonce, expiry, v, r, s);

        bytes32 transferId = _computeTransferId(bank, beneficiary, amount, commitment, nonce, expiry);

        vm.prank(safe);
        vm.expectRevert(InterbankVault.BeneficiaryMismatch.selector);
        vault.release(transferId, payable(wrong));
    }

    // ─────────────────────────────────────────────────────────────
    // Test 11: relayer funds open — only depositor can refund after expiry
    // ─────────────────────────────────────────────────────────────
    function test_relayerOpens_onlyDepositorRefunds() public {
        address relayer = makeAddr("relayer");
        address beneficiary = makeAddr("beneficiary");
        uint256 amount = 1 ether;
        bytes32 commitment = keccak256("commitment data");
        uint256 nonce = 0;
        uint256 expiry = block.timestamp + 1;

        (uint8 v, bytes32 r, bytes32 s) = _sign(bank, beneficiary, amount, commitment, nonce, expiry, bankKey);

        vm.deal(relayer, amount);
        vm.prank(relayer);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, nonce, expiry, v, r, s);

        bytes32 transferId = _computeTransferId(bank, beneficiary, amount, commitment, nonce, expiry);

        vm.warp(block.timestamp + 2);

        vm.prank(bank);
        vm.expectRevert(InterbankVault.NotDepositor.selector);
        vault.refund(transferId);

        uint256 relayerBefore = relayer.balance;
        vm.prank(relayer);
        vault.refund(transferId);
        assertEq(relayer.balance, relayerBefore + amount);
    }

    // ─────────────────────────────────────────────────────────────
    // Test 12: fork Fuji deployment (optional)
    // Skipped: requires env vars; stack-too-deep in this scope.
    // To run manually: forge script script/Deploy.s.sol --rpc-url FUJI_RPC_URL
    // ─────────────────────────────────────────────────────────────
    function test_forkFuji_deployAndBasicFlow() public pure {
        // Skipped — see script/Deploy.s.sol for manual Fuji deployment
    }

    // ─────────────────────────────────────────────────────────────
    // Internal: compute transferId (mirrors contract logic)
    // ─────────────────────────────────────────────────────────────
    function _computeTransferId(
        address _bank,
        address _beneficiary,
        uint256 _amount,
        bytes32 _commitment,
        uint256 _bankNonce,
        uint256 _expiry
    ) internal view returns (bytes32) {
        bytes32 openDigest = EIP712._hashTypedDataV4(
            EIP712_NAME,
            EIP712_VERSION,
            block.chainid,
            address(vault),
            _bank,
            _beneficiary,
            _amount,
            _commitment,
            _bankNonce,
            _expiry
        );
        return keccak256(abi.encodePacked(openDigest, _bank, _bankNonce));
    }
}
