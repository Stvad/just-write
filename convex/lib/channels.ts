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
    slug: "feedback",
    name: "feedback",
    description: "Share a draft, ask for eyes.",
  },
  {
    slug: "ideas",
    name: "ideas",
    description: "Essay ideas, titles, and hooks.",
  },
  {
    slug: "sf",
    name: "sf",
    description: "Saturday writing circles at Mox, and other IRL plans.",
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
