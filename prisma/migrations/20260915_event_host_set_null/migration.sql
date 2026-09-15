-- Preserve events when their host account is deleted.
ALTER TABLE "Event" DROP CONSTRAINT IF EXISTS "Event_hostId_fkey";
ALTER TABLE "Event"
  ADD CONSTRAINT "Event_hostId_fkey"
  FOREIGN KEY ("hostId") REFERENCES "User"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
