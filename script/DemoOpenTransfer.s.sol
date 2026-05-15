// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {InterbankVault} from "../src/InterbankVault.sol";
import {EIP712} from "../src/libraries/EIP712.sol";

/// @notice Demo script: bank abre un Transfer via EIP-712 signature
contract DemoOpenTransferScript is Script {
    function run() external {
        uint256 bankPrivateKey = vm.envUint("BANK_DEMO_PRIVATE_KEY");
        address bank = vm.addr(bankPrivateKey);
        address beneficiary = vm.envAddress("BANK_DEMO_BENEFICIARY");
        uint256 amount = vm.envUint("DEMO_AMOUNT");
        uint256 expiry = block.timestamp + 3600;
        bytes32 commitment = keccak256(abi.encodePacked("CNBV demo payload"));
        address vaultAddress = vm.envAddress("INDEXER_VAULT_ADDRESS");
        uint256 bankNonce = 0;

        // Build EIP-712 digest
        bytes32 digest = EIP712._hashTypedDataV4(
            "InterbankVault", "1", block.chainid, vaultAddress,
            bank, beneficiary, amount, commitment, bankNonce, expiry
        );

        console.log("Bank:", bank);
        console.log("Beneficiary:", beneficiary);
        console.log("Amount:", amount);

        // Sign and call
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(bankPrivateKey, digest);

        InterbankVault vault = InterbankVault(vaultAddress);

        vm.startBroadcast(bankPrivateKey);
        vault.openTransfer{value: amount}(bank, beneficiary, amount, commitment, bankNonce, expiry, v, r, s);
        vm.stopBroadcast();

        console.log("Transfer opened! Vault balance:", address(vault).balance);
    }
}