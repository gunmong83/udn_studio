import { DatabaseSync } from "node:sqlite";

const dbPath = process.argv[2];
if (!dbPath) throw new Error("사용법: node scripts/init-local-db.mjs <db-path>");

const db = new DatabaseSync(dbPath);
db.exec(`
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY NOT NULL,
  role TEXT NOT NULL DEFAULT 'CUSTOMER',
  email TEXT UNIQUE,
  name TEXT,
  image TEXT,
  emailVerified DATETIME,
  passwordHash TEXT,
  termsAgreedAt DATETIME,
  privacyAgreedAt DATETIME,
  phone TEXT,
  phoneVerifiedAt DATETIME,
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
CREATE TABLE IF NOT EXISTS RequestRateLimit (
  key TEXT PRIMARY KEY NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  windowStartedAt DATETIME NOT NULL,
  blockedUntil DATETIME,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS RequestRateLimit_blockedUntil_idx ON RequestRateLimit(blockedUntil);
CREATE TABLE IF NOT EXISTS PhoneVerificationChallenge (
  id TEXT PRIMARY KEY NOT NULL,
  phone TEXT NOT NULL,
  requestIpHash TEXT NOT NULL,
  codeHash TEXT NOT NULL,
  verificationTokenHash TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  expiresAt DATETIME NOT NULL,
  verifiedAt DATETIME,
  consumedAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS PhoneVerificationChallenge_phone_createdAt_idx ON PhoneVerificationChallenge(phone, createdAt);
CREATE INDEX IF NOT EXISTS PhoneVerificationChallenge_requestIpHash_createdAt_idx ON PhoneVerificationChallenge(requestIpHash, createdAt);
CREATE INDEX IF NOT EXISTS PhoneVerificationChallenge_expiresAt_idx ON PhoneVerificationChallenge(expiresAt);
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
  epostDeliveryStatus TEXT,
  epostLatestEventDate TEXT,
  epostLatestEventTime TEXT,
  epostLatestEventLocation TEXT,
  epostLatestEventStatus TEXT,
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
CREATE TABLE IF NOT EXISTS ShipmentNotification (
  id TEXT PRIMARY KEY NOT NULL,
  orderId TEXT NOT NULL UNIQUE,
  carrier TEXT NOT NULL,
  trackingNumber TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'READY',
  attempts INTEGER NOT NULL DEFAULT 0,
  requestId TEXT,
  messageId TEXT,
  errorCode TEXT,
  acceptedAt DATETIME,
  deliveredAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orderId) REFERENCES "Order"(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS ShipmentNotification_status_updatedAt_idx ON ShipmentNotification(status, updatedAt);
CREATE TABLE IF NOT EXISTS AnalyticsSession (
  id TEXT PRIMARY KEY NOT NULL, visitorId TEXT NOT NULL, userId TEXT, ip TEXT,
  country TEXT, networkType TEXT, rtt INTEGER, screenWidth INTEGER, screenHeight INTEGER,
  language TEXT, referrer TEXT, referrerDomain TEXT, entryPath TEXT NOT NULL,
  device TEXT, browser TEXT, os TEXT, duration INTEGER NOT NULL DEFAULT 0,
  pageCount INTEGER NOT NULL DEFAULT 1, measurementVersion INTEGER NOT NULL DEFAULT 0,
  utmSource TEXT, utmMedium TEXT, utmCampaign TEXT, utmContent TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS AnalyticsPageView (
  id TEXT PRIMARY KEY NOT NULL, sessionId TEXT NOT NULL, path TEXT NOT NULL, title TEXT,
  duration INTEGER NOT NULL DEFAULT 0, scrollDepth INTEGER, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sessionId) REFERENCES AnalyticsSession(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS AnalyticsEvent (
  id TEXT PRIMARY KEY NOT NULL, sessionId TEXT NOT NULL, name TEXT NOT NULL, path TEXT NOT NULL,
  productId TEXT, quantity INTEGER, reason TEXT, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sessionId) REFERENCES AnalyticsSession(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS AnalyticsSession_createdAt_idx ON AnalyticsSession(createdAt);
CREATE INDEX IF NOT EXISTS AnalyticsSession_visitorId_idx ON AnalyticsSession(visitorId);
CREATE INDEX IF NOT EXISTS AnalyticsPageView_sessionId_idx ON AnalyticsPageView(sessionId);
CREATE INDEX IF NOT EXISTS AnalyticsPageView_createdAt_idx ON AnalyticsPageView(createdAt);
CREATE INDEX IF NOT EXISTS AnalyticsEvent_sessionId_createdAt_idx ON AnalyticsEvent(sessionId, createdAt);
CREATE INDEX IF NOT EXISTS AnalyticsEvent_name_createdAt_idx ON AnalyticsEvent(name, createdAt);
`);
for (const [table, column, type] of [
  ["Order", "analyticsSessionId", "TEXT"], ["Order", "paidAt", "DATETIME"],
  ["AnalyticsSession", "utmSource", "TEXT"], ["AnalyticsSession", "utmMedium", "TEXT"],
  ["AnalyticsSession", "utmCampaign", "TEXT"], ["AnalyticsSession", "utmContent", "TEXT"],
  ["AnalyticsSession", "measurementVersion", "INTEGER NOT NULL DEFAULT 0"],
]) {
  const columns = db.prepare(`PRAGMA table_info("${table}")`).all();
  if (!columns.some((entry) => entry.name === column)) db.exec(`ALTER TABLE "${table}" ADD COLUMN "${column}" ${type}`);
}
db.exec('CREATE INDEX IF NOT EXISTS Order_analyticsSessionId_idx ON "Order"(analyticsSessionId); CREATE INDEX IF NOT EXISTS Order_paidAt_idx ON "Order"(paidAt);');
for (const column of ["epostDeliveryStatus", "epostLatestEventDate", "epostLatestEventTime", "epostLatestEventLocation", "epostLatestEventStatus"]) {
  try {
    db.exec(`ALTER TABLE "Order" ADD COLUMN ${column} TEXT`);
  } catch {
    // Column already exists in a previously initialized local database.
  }
}
for (const column of ["termsAgreedAt", "privacyAgreedAt", "phoneVerifiedAt", "defaultRecipientName", "defaultPhone", "defaultZonecode", "defaultAddress", "defaultAddressDetail"]) {
  try {
    db.exec(`ALTER TABLE User ADD COLUMN ${column} TEXT`);
  } catch {
    // Column already exists in a previously initialized local database.
  }
}
try {
  db.exec("ALTER TABLE User ADD COLUMN role TEXT NOT NULL DEFAULT 'CUSTOMER'");
} catch {
  // Column already exists in a previously initialized local database.
}
db.close();
console.log(`Local SQLite ready: ${dbPath}`);
