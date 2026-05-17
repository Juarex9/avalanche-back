import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const kycStatusEnum = pgEnum("kyc_status", [
  "pending",
  "approved",
  "rejected",
]);

export const transferTypeEnum = pgEnum("transfer_type", [
  "register",
  "transfer",
  "mint",
  "burn",
  "other",
]);

/** Institución / wallet verificada (metadata off-chain; montos siguen on-chain). */
export const institutions = pgTable(
  "institutions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    walletAddress: text("wallet_address").notNull(),
    name: text("name").notNull(),
    initials: text("initials").notNull().default("??"),
    kycStatus: kycStatusEnum("kyc_status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("institutions_wallet_unique").on(t.walletAddress),
    index("institutions_kyc_idx").on(t.kycStatus),
  ],
);

/** Índice liviano de txs (sin monto en claro). */
export const indexedTransfers = pgTable(
  "indexed_transfers",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    txHash: text("tx_hash").notNull(),
    fromAddress: text("from_address").notNull(),
    toAddress: text("to_address"),
    transferType: transferTypeEnum("transfer_type").notNull().default("transfer"),
    reference: text("reference"),
    contractAddress: text("contract_address"),
    indexedAt: timestamp("indexed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("indexed_transfers_hash_unique").on(t.txHash),
    index("indexed_transfers_from_idx").on(t.fromAddress),
    index("indexed_transfers_to_idx").on(t.toAddress),
    index("indexed_transfers_indexed_at_idx").on(t.indexedAt),
  ],
);

export type Institution = typeof institutions.$inferSelect;
export type NewInstitution = typeof institutions.$inferInsert;
export type IndexedTransfer = typeof indexedTransfers.$inferSelect;
export type NewIndexedTransfer = typeof indexedTransfers.$inferInsert;
