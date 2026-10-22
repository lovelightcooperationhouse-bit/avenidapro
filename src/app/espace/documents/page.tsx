"use client";

import { FolderOpen } from "lucide-react";
import { DocumentList } from "@/components/documents/DocumentList";
import { useAuth } from "@/context/AuthContext";

/** Classeur personnel : documents reçus de l'administration et pièces déposées. */
export default function DocumentsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold tracking-widest text-vif uppercase">
          <FolderOpen aria-hidden className="size-4" /> Mes documents
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-avenida-blue">Mon classeur</h1>
        <p className="mt-1 text-sm text-slate-600">Fiches, attestations, reçus, convocations envoyés par l&apos;administration, et les pièces que vous avez déposées. Tout est consultable et téléchargeable.</p>
      </div>
      <DocumentList profileId={user.id} viewerId={user.id} mode="membre" />
    </div>
  );
}
