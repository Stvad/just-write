import type { ReactNode } from "react";
import { PortalFrame } from "@/components/portal/frame";

// Public, like /members: members see it inside the portal, everyone else gets a simple header.
export default function ImprovementsLayout({ children }: { children: ReactNode }) {
  return <PortalFrame membersOnly={false}>{children}</PortalFrame>;
}
