"use client";

import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";

/** Cloche avec le nombre de notifications non lues (temps réel). */
export function NotificationBell({ href = "/espace/notifications", className }: { href?: string; className?: string }) {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    const load = () =>
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id)
        .is("read_at", null)
        .then(({ count }) => setUnread(count ?? 0));
    load();
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `profile_id=eq.${user.id}` }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <Link
      href={href}
      aria-label={unread ? `${unread} notification(s) non lue(s)` : "Notifications"}
      className={className ?? cn("relative flex size-10 items-center justify-center rounded-full transition-colors hover:bg-red-50", unread ? "text-[#E30613]" : "text-[#E30613]/80 hover:text-[#E30613]")}
    >
      <Bell aria-hidden className={cn("size-5", unread > 0 && "fill-[#E30613]/15")} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-[#E30613] px-1 text-[10px] font-bold text-white ring-2 ring-white">{unread > 99 ? "99+" : unread}</span>
      )}
    </Link>
  );
}
