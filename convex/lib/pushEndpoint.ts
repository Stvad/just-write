// The push services browsers subscribe through. Subscriptions are only saved for, and
// sent to, these hosts, so a member can't make the server send requests to any URL.
const HOSTS = ["fcm.googleapis.com", "android.googleapis.com"]; // Chrome and other Chromium browsers
const SUFFIXES = [
  ".push.services.mozilla.com", // Firefox
  ".push.apple.com", // Safari
  ".notify.windows.com", // Edge
];

export function isPushEndpoint(raw: string) {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.username || url.password || url.port)
    return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  return HOSTS.includes(host) || SUFFIXES.some((s) => host.endsWith(s));
}
