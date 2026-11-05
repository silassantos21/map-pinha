"use server";

import { signOut } from "@/auth";

/** Separado de `auth-button.tsx` pra poder ser chamado direto de um Client
 * Component (`ProfilePanel`) sem precisar embrulhar num `<form>` — Server
 * Actions podem ser importadas e invocadas como função normal fora de um
 * form também. */
export async function signOutAction() {
  await signOut();
}
