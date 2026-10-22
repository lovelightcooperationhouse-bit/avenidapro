"use client";

import { useParams } from "next/navigation";
import { SpaceRoom } from "@/components/campus/SpaceRoom";

export default function SallePage() {
  const { id } = useParams<{ id: string }>();
  return <SpaceRoom spaceId={id} />;
}
