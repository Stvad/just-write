// Service worker: shows chat notifications sent by convex/pushAction.ts and opens the
// app when one is clicked. It doesn't cache anything; the portal needs the network anyway.
// Registered from lib/push.ts when someone turns notifications on.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const shown = self.registration.showNotification(data.title || "Just Write", {
    body: data.body,
    tag: data.tag,
    renotify: !!data.tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-96.png",
    data: { url: data.url || "/home" },
  });
  // Unread channels on the app icon, where supported.
  const badge =
    data.badge && self.navigator.setAppBadge
      ? self.navigator.setAppBadge(data.badge).catch(() => {})
      : null;
  event.waitUntil(Promise.all([shown, badge]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/home", self.location)
    .href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const win = windows.find((w) => w.focused) || windows[0];
      if (win) {
        // The page navigates itself (app/providers.tsx), which is faster than a reload.
        await win.focus();
        win.postMessage({ type: "navigate", url });
      } else {
        await self.clients.openWindow(url);
      }
    })(),
  );
});
