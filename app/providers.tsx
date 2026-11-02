"use client";

import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { ConvexProviderWithAuth, ConvexReactClient } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authClient } from "@/lib/auth-client";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Public pages: Better Auth's own provider, which watches the session (so /sign-in can
// redirect once you're in) and fetches a Convex token when there is one.
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider client={convex} authClient={authClient}>
      {children}
    </ConvexBetterAuthProvider>
  );
}

// Portal pages: the server already turned the session cookie into a Convex token
// (app/(portal)/layout.tsx), so the client starts authenticated and connects right away.
// ConvexBetterAuthProvider's `initialToken` would do the same, but it rebuilds its auth
// callback once its own session request returns, which resets the Convex connection and
// flashes the loading screen; this one keeps the callback stable.
const InitialToken = createContext<string | null>(null);

export function PortalProviders({
  initialToken,
  children,
}: {
  initialToken: string | null;
  children: ReactNode;
}) {
  return (
    <InitialToken.Provider value={initialToken}>
      <ConvexProviderWithAuth client={convex} useAuth={usePortalAuth}>
        {children}
      </ConvexProviderWithAuth>
    </InitialToken.Provider>
  );
}

function usePortalAuth() {
  const initial = useContext(InitialToken);
  const token = useRef(initial);
  const [signedIn, setSignedIn] = useState(initial !== null);

  // Convex calls this with forceRefreshToken before the token expires (and once right after
  // connecting); a null result means the session is gone, and PortalFrame redirects.
  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
      if (token.current && !forceRefreshToken) return token.current;
      const { data } = await authClient.convex.token({
        fetchOptions: { throw: false },
      });
      token.current = data?.token ?? null;
      if (!token.current) setSignedIn(false);
      return token.current;
    },
    [],
  );

  return useMemo(
    () => ({ isLoading: false, isAuthenticated: signedIn, fetchAccessToken }),
    [signedIn, fetchAccessToken],
  );
}
