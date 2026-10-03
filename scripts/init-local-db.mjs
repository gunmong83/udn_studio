import { DatabaseSync } from "node:sqlite";

const dbPath = process.argv[2];
if (!dbPath) throw new Error("사용법: node scripts/init-local-db.mjs <db-path>");

const db = new DatabaseSync(dbPath);
db.exec(`
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT UNIQUE,
  name TEXT,
  image TEXT,
  emailVerified DATETIME,
  passwordHash TEXT,
  phone TEXT,
  defaultRecipientName TEXT,
  defaultPhone TEXT,
  defaultZonecode TEXT,
  defaultAddress TEXT,
  defaultAddressDetail TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS Account (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(provider, providerAccountId)
);
CREATE TABLE IF NOT EXISTS CartItem (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT NOT NULL,
  productId TEXT NOT NULL,
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(userId, productId)
);
CREATE TABLE IF NOT EXISTS "Order" (
  id TEXT PRIMARY KEY NOT NULL,
  userId TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  paymentStatus TEXT NOT NULL DEFAULT 'UNPAID',
  paymentKey TEXT UNIQUE,
  totalAmount INTEGER NOT NULL,
  recipientName TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  addressDetail TEXT,
  carrier TEXT,
  trackingNumber TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS OrderItem (
  id TEXT PRIMARY KEY NOT NULL,
  orderId TEXT NOT NULL,
  productId TEXT NOT NULL,
  title TEXT NOT NULL,
  unitPrice INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  FOREIGN KEY (orderId) REFERENCES "Order"(id) ON DELETE CASCADE
);
`);
for (const column of ["defaultRecipientName", "defaultPhone", "defaultZonecode", "defaultAddress", "defaultAddressDetail"]) {
  try {
    db.exec(`ALTER TABLE User ADD COLUMN ${column} TEXT`);
  } catch {
    // Column already exists in a previously initialized local database.
  }
}
db.close();
console.log(`Local SQLite ready: ${dbPath}`);
