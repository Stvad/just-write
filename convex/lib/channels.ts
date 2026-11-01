// The channels every deployment starts with (created by chat:seedChannels).
export const DEFAULT_CHANNELS = [
  { slug: "general", name: "general", description: "Anything and everything." },
  {
    slug: "check-ins",
    name: "check-ins",
    description:
      "Daily check-ins: share about 100 words of what you’re writing.",
  },
  {
    slug: "published",
    name: "published",
    description: "New essays are posted here automatically.",
  },
  {
    slug: "meetups",
    name: "meetups",
    description: "Writing circles and other sessions. New ones are posted here.",
  },
  { slug: "random", name: "random", description: "Anything else." },
  {
    slug: "site",
    name: "site",
    description:
      "Changes to this site. Mention @Claude anywhere to ask for one.",
  },
];

// How many messages the channel view loads at a time.
export const PAGE_SIZE = 50;

// #check-ins is gated: until you've posted a check-in of your own within this window,
// other people's posts show only a short preview.
export const CHECK_IN_SLUG = "check-ins";
export const CHECK_IN_WINDOW_MS = 24 * 60 * 60 * 1000;
export const CHECK_IN_PREVIEW_CHARS = 100;

// Push notifications for a channel share this tag, so a new one replaces the last,
// and opening the channel clears them.
export const notificationTag = (slug: string) => `chat:${slug}`;
