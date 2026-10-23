import { auth } from "@/auth";
import { PoiCreateButtonClient } from "@/components/layout/poi-create-button-client";

export async function PoiCreateButton() {
  const session = await auth();
  return <PoiCreateButtonClient isAuthenticated={Boolean(session?.user)} />;
}
