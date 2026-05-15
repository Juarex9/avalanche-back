// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {InterbankVault} from "../src/InterbankVault.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address finNovaSafe = vm.envAddress("FIN_NOVA_SAFE");
        bytes32 cnbvViewPubKey = vm.envBytes32("CNBV_VIEW_PUB_KEY");

        vm.startBroadcast(deployerPrivateKey);

        InterbankVault vault = new InterbankVault(finNovaSafe, cnbvViewPubKey);

        console.log("InterbankVault deployed at:", address(vault));
        console.log("FinNova Safe:", finNovaSafe);
        console.log("CNBV View PubKey:", vm.toString(cnbvViewPubKey));

        vm.stopBroadcast();
    }
}