"use client";

import { Messenger } from "@/components/espace/Messenger";

export default function DashboardMessagesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black text-[#0C356A]">Messagerie</h1>
        <p className="mt-1 text-sm text-slate-600">Échanges avec les élèves, les parents, les professeurs et les équipes.</p>
      </div>
      <Messenger />
    </div>
  );
}
