-- Index foreign-key columns used by user deletion cascades and relation lookups.
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");
CREATE INDEX "StoryView_viewerId_idx" ON "StoryView"("viewerId");
CREATE INDEX "Gift_fromUserId_idx" ON "Gift"("fromUserId");
CREATE INDEX "Event_hostId_idx" ON "Event"("hostId");
CREATE INDEX "EventAttendee_userId_idx" ON "EventAttendee"("userId");
CREATE INDEX "Report_fromUserId_idx" ON "Report"("fromUserId");
