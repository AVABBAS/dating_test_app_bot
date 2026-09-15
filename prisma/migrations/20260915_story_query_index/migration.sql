-- Optimize the active-story query: filter by expiry and order by creation time.
CREATE INDEX "Story_expiresAt_createdAt_idx" ON "Story"("expiresAt", "createdAt");
