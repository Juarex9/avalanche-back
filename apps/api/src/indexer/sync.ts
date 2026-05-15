import type { PublicClient } from 'viem';
import type { Database } from '../db/sqlite.js';
import { getCursor, setCursor } from '../db/cursor.js';
import { upsertTransfer, updateTransferState } from '../db/repo.js';
import { INTERBANK_VAULT_ABI } from '../chain/vault.abi.js';
import {
  decodeTransferOpened,
  decodeTransferReleased,
  decodeTransferRefunded,
  isTransferOpenedEvent,
  isTransferReleasedEvent,
  isTransferRefundedEvent,
  type TransferOpenedDecoded,
  type TransferReleasedDecoded,
  type TransferRefundedDecoded,
} from './decode.js';

const BATCH_SIZE = 2048;
const CURSOR_KEY = 'vault_events';

// Internal event types matching decode.ts
interface UpsertEvent {
  transferId: string;
  bank: string;
  beneficiary: string;
  amount: bigint;
  commitment: string;
  expiry: number;
  openedBlock: number;
  openedTx: string;
}

export async function runSync(
  client: PublicClient,
  db: Database,
  vaultAddress: `0x${string}`,
  _fromBlock: number,
): Promise<number> {
  // Get last synced block from DB
  let lastBlock = getCursor(db, CURSOR_KEY);
  if (lastBlock === 0) {
    lastBlock = _fromBlock;
  } else {
    lastBlock += 1;
  }

  // Get latest block from RPC
  const latestBlock = await client.getBlockNumber();
  const latestNum = Number(latestBlock);

  if (lastBlock > latestNum) {
    return lastBlock - 1;
  }

  // Process in batches of 2048 blocks max
  let fromBlock = lastBlock;
  let lastProcessedBlock = lastBlock - 1;

  while (fromBlock <= latestNum) {
    const toBlock = Math.min(fromBlock + BATCH_SIZE - 1, latestNum);

    let logs;
    try {
      logs = await client.getLogs({
        address: vaultAddress,
        event: INTERBANK_VAULT_ABI.find((e) => e.type === 'event' && e.name === 'TransferOpened')!,
        fromBlock: BigInt(fromBlock),
        toBlock: BigInt(toBlock),
        strict: true,
      });
    } catch (err) {
      if (fromBlock === toBlock) throw err;
      // Fall back to single-block chunks on RPC error
      for (let b = fromBlock; b <= toBlock; b++) {
        try {
          const singleLogs = await client.getLogs({
            address: vaultAddress,
            event: INTERBANK_VAULT_ABI.find((e) => e.type === 'event' && e.name === 'TransferOpened')!,
            fromBlock: BigInt(b),
            toBlock: BigInt(b),
            strict: true,
          });
          for (const log of singleLogs) {
            if (isTransferOpenedEvent(log)) {
              const decoded = decodeTransferOpened(log);
              upsertTransfer(db, decoded as unknown as UpsertEvent);
            }
          }
          lastProcessedBlock = b;
        } catch {
          // Skip failing single block
        }
      }
      fromBlock = toBlock + 1;
      continue;
    }

    // Decode and persist TransferOpened events
    for (const log of logs) {
      if (isTransferOpenedEvent(log)) {
        const decoded = decodeTransferOpened(log);
        upsertTransfer(db, decoded as unknown as UpsertEvent);
      }
    }

    lastProcessedBlock = toBlock;
    fromBlock = toBlock + 1;
  }

  // Fetch TransferReleased events
  await syncReleasedEvents(client, db, vaultAddress, lastBlock, latestNum);

  // Fetch TransferRefunded events
  await syncRefundedEvents(client, db, vaultAddress, lastBlock, latestNum);

  // Update cursor
  setCursor(db, CURSOR_KEY, latestNum);

  return lastProcessedBlock;
}

async function syncReleasedEvents(
  client: PublicClient,
  db: Database,
  vaultAddress: `0x${string}`,
  fromBlock: number,
  toBlock: number,
): Promise<void> {
  try {
    const logs = await client.getLogs({
      address: vaultAddress,
      event: INTERBANK_VAULT_ABI.find((e) => e.type === 'event' && e.name === 'TransferReleased')!,
      fromBlock: BigInt(fromBlock),
      toBlock: BigInt(toBlock),
      strict: true,
    });

    for (const log of logs) {
      if (isTransferReleasedEvent(log)) {
        const decoded = decodeTransferReleased(log);
        updateTransferState(db, decoded.transferId, 'released');
      }
    }
  } catch {
    // Best-effort for released events
  }
}

async function syncRefundedEvents(
  client: PublicClient,
  db: Database,
  vaultAddress: `0x${string}`,
  fromBlock: number,
  toBlock: number,
): Promise<void> {
  try {
    const logs = await client.getLogs({
      address: vaultAddress,
      event: INTERBANK_VAULT_ABI.find((e) => e.type === 'event' && e.name === 'TransferRefunded')!,
      fromBlock: BigInt(fromBlock),
      toBlock: BigInt(toBlock),
      strict: true,
    });

    for (const log of logs) {
      if (isTransferRefundedEvent(log)) {
        const decoded = decodeTransferRefunded(log);
        updateTransferState(db, decoded.transferId, 'refunded');
      }
    }
  } catch {
    // Best-effort for refunded events
  }
}