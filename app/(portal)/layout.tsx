import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Loading, PortalFrame } from "@/components/portal/frame";
import { getToken } from "@/lib/auth-server";
import { Document } from "../document";
import { PortalProviders } from "../providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://justwrite.club"),
  title: "Just Write",
  robots: { index: false, follow: false },
};

// Root layout for the portal, separate from app/(site) so it can read the session cookie
// on every request without making the public pages dynamic. (Moving between the two is a
// full page load, which is fine: they're different apps to the visitor.)
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <Document>
      <Suspense fallback={<Loading />}>
        <Portal>{children}</Portal>
      </Suspense>
    </Document>
  );
}

// Fetches the viewer's Convex token from their session cookie before the page streams, so
// the browser opens its Convex connection already signed in instead of asking /api/auth for
// the session and then a token first (two proxied round trips). Signed-out visitors get
// null, and PortalFrame sends them to /sign-in.
async function Portal({ children }: { children: ReactNode }) {
  const token = await getToken();
  return (
    <PortalProviders initialToken={token ?? null}>
      <PortalFrame membersOnly>{children}</PortalFrame>
    </PortalProviders>
  );
}
