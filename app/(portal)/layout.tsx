import { getSessionCookie } from "better-auth/cookies";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense, type ReactNode } from "react";
import { Loading } from "@/components/portal/frame";
import { getToken } from "@/lib/auth-server";
import { Document } from "../document";
import { PortalProviders } from "../providers";

export const metadata: Metadata = {
  metadataBase: new URL("https://justwrite.club"),
  title: "Just Write",
  robots: { index: false, follow: false },
};

// Root layout for the portal, separate from app/(site) so it can read the session cookie
// on every request without making the public pages dynamic. Everything the sidebar links
// to lives under it (member-only pages in (members), plus the public /members and
// /improvements), so those are client-side navigations; coming in from the landing page
// or /sign-in is a full page load, which is fine.
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <Document>
      <Suspense fallback={<Loading />}>
        <Portal>{children}</Portal>
      </Suspense>
    </Document>
  );
}

// Turns the viewer's session cookie into a Convex token before the page streams, so the
// browser opens its Convex connection already signed in instead of asking /api/auth for
// the session and then a token first (two proxied round trips). Without a session cookie
// there's nothing to ask, so signed-out visitors skip the Convex call entirely.
async function Portal({ children }: { children: ReactNode }) {
  const token = getSessionCookie(await headers()) ? await getToken() : null;
  return (
    <PortalProviders initialToken={token ?? null}>{children}</PortalProviders>
  );
}
