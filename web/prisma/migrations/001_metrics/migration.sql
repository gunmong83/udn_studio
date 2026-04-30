CREATE TABLE "SiteVisit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "referrer" TEXT,
  "userAgent" TEXT,
  "ipHash" TEXT,
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" DATETIME,
  "durationSeconds" INTEGER,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "SiteVisit_sessionId_idx" ON "SiteVisit"("sessionId");
CREATE INDEX "SiteVisit_path_idx" ON "SiteVisit"("path");
CREATE INDEX "SiteVisit_startedAt_idx" ON "SiteVisit"("startedAt");
