"use client";

import { Messenger } from "@/components/espace/Messenger";

export default function EspaceMessagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-avenida-blue">Messages</h1>
        <p className="mt-1 text-slate-600">Échangez avec l&apos;administration, les professeurs et les familles, en toute transparence.</p>
      </div>
      <Messenger />
    </div>
  );
}
