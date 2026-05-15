export declare const INTERBANK_VAULT_ABI: readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_finNovaSafe";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "_cnbvViewPubKey";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "EIP712_NAME";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
        readonly internalType: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "EIP712_VERSION";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "string";
        readonly internalType: "string";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "bankNonces";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "cnbvViewPubKey";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "finNovaSafe";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getTransfer";
    readonly inputs: readonly [{
        readonly name: "transferId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "";
        readonly type: "uint8";
        readonly internalType: "enum InterbankVault.State";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getTransferState";
    readonly inputs: readonly [{
        readonly name: "transferId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint8";
        readonly internalType: "enum InterbankVault.State";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "openTransfer";
    readonly inputs: readonly [{
        readonly name: "bank";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "beneficiary";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "commitment";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "bankNonce";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "expiry";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "v";
        readonly type: "uint8";
        readonly internalType: "uint8";
    }, {
        readonly name: "r";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "s";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "payable";
}, {
    readonly type: "function";
    readonly name: "refund";
    readonly inputs: readonly [{
        readonly name: "transferId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "release";
    readonly inputs: readonly [{
        readonly name: "transferId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly internalType: "address payable";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "transfers";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "transferId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "bank";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "beneficiary";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "depositor";
        readonly type: "address";
        readonly internalType: "address payable";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "commitment";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "bankNonce";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "expiry";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "state";
        readonly type: "uint8";
        readonly internalType: "enum InterbankVault.State";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "event";
    readonly name: "TransferOpened";
    readonly inputs: readonly [{
        readonly name: "transferId";
        readonly type: "bytes32";
        readonly indexed: true;
        readonly internalType: "bytes32";
    }, {
        readonly name: "bank";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "beneficiary";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }, {
        readonly name: "commitment";
        readonly type: "bytes32";
        readonly indexed: false;
        readonly internalType: "bytes32";
    }, {
        readonly name: "expiry";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "TransferRefunded";
    readonly inputs: readonly [{
        readonly name: "transferId";
        readonly type: "bytes32";
        readonly indexed: true;
        readonly internalType: "bytes32";
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "TransferReleased";
    readonly inputs: readonly [{
        readonly name: "transferId";
        readonly type: "bytes32";
        readonly indexed: true;
        readonly internalType: "bytes32";
    }, {
        readonly name: "to";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }];
    readonly anonymous: false;
}, {
    readonly type: "error";
    readonly name: "BeneficiaryMismatch";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "InvalidSignature";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "InvalidTransferState";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "NativeRefundFailed";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "NativeTransferFailed";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "NonceMismatch";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "NotDepositor";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "NotExpired";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "OnlyFinNovaSafe";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "TransferExpired";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "ValueMismatch";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "ZeroAmount";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "ZeroBank";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "ZeroBeneficiary";
    readonly inputs: readonly [];
    readonly internalType: "error";
}, {
    readonly type: "error";
    readonly name: "ZeroSafeAddress";
    readonly inputs: readonly [];
    readonly internalType: "error";
}];
//# sourceMappingURL=vault.abi.d.ts.map