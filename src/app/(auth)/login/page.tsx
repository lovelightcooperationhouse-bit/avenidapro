import { redirect } from "next/navigation";

/** Ancienne adresse de connexion : la page officielle est /connexion. */
export default function LoginPage() {
  redirect("/connexion");
}
