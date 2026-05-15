import { decodeEventLog } from 'viem';
import { INTERBANK_VAULT_ABI } from '../chain/vault.abi.js';
function getEventAbi(name) {
    return INTERBANK_VAULT_ABI.find((e) => e.type === 'event' && e.name === name);
}
// Pre-compute event signatures for type guard
const TRANSFER_OPENED_SIG = '0x3e282583ea741790f2090d958af5a1d5534cd73e68acfb947ecdd31cf2280da6';
const TRANSFER_RELEASED_SIG = '0xd8a6181e19f62dc59876592bc8e07da497d900f46426a3462b2fc3a1507c4a63';
const TRANSFER_REFUNDED_SIG = '0x3ee347903cf8f0827750e2e0e4fc3b5552f2edee11e7e2d27ce74a47c36d1964';
export function isTransferOpenedEvent(log) {
    return log.topics[0] === TRANSFER_OPENED_SIG;
}
export function isTransferReleasedEvent(log) {
    return log.topics[0] === TRANSFER_RELEASED_SIG;
}
export function isTransferRefundedEvent(log) {
    return log.topics[0] === TRANSFER_REFUNDED_SIG;
}
export function decodeTransferOpened(log) {
    const abiEntry = getEventAbi('TransferOpened');
    const raw = decodeEventLog({
        abi: [abiEntry],
        data: log.data,
        topics: log.topics,
    });
    const args = raw.args;
    return {
        transferId: args.transferId,
        bank: args.bank,
        beneficiary: args.beneficiary,
        amount: args.amount,
        commitment: args.commitment,
        expiry: Number(args.expiry),
        blockNumber: Number(log.blockNumber),
        txHash: log.transactionHash,
    };
}
export function decodeTransferReleased(log) {
    const abiEntry = getEventAbi('TransferReleased');
    const raw = decodeEventLog({
        abi: [abiEntry],
        data: log.data,
        topics: log.topics,
    });
    const args = raw.args;
    return {
        transferId: args.transferId,
        to: args.to,
        amount: args.amount,
        blockNumber: Number(log.blockNumber),
        txHash: log.transactionHash,
    };
}
export function decodeTransferRefunded(log) {
    const abiEntry = getEventAbi('TransferRefunded');
    const raw = decodeEventLog({
        abi: [abiEntry],
        data: log.data,
        topics: log.topics,
    });
    const args = raw.args;
    return {
        transferId: args.transferId,
        to: args.to,
        amount: args.amount,
        blockNumber: Number(log.blockNumber),
        txHash: log.transactionHash,
    };
}
//# sourceMappingURL=decode.js.map