"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { ChatApp } from "@/components/chat/ChatApp";
import { useAuth } from "@/context/AuthContext";

/** Discussions plein écran (comme une application de messagerie), pour tous les membres connectés. */
export default function DiscussionsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!isLoading && !user) router.replace("/connexion?suite=/discussions");
  }, [isLoading, user, router]);

  return (
    <div className="h-dvh bg-slate-200 md:p-4">
      {user ? (
        <Suspense fallback={<Loader2 aria-label="Chargement" className="mx-auto mt-20 size-8 animate-spin" />}>
          <ChatApp />
        </Suspense>
      ) : (
        <Loader2 aria-label="Chargement" className="mx-auto mt-20 size-8 animate-spin" />
      )}
    </div>
  );
}
