import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Marks @Claude runs whose sandbox died without reporting back as failed.
crons.interval(
  "reap stale improvements",
  { minutes: 10 },
  internal.improvements.reapStale,
);

// Emails the 24h reminders for calendar sessions.
crons.interval(
  "session reminders",
  { minutes: 15 },
  internal.events.claimReminders,
);

export default crons;
