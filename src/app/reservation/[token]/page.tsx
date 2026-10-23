import type { Metadata } from "next";
import { BookingReceipt } from "@/components/site/BookingReceipt";
import { onlineMethods } from "@/lib/payments";

export const metadata: Metadata = { title: "Reçu de réservation · Hôtel École Avenida", robots: { index: false, follow: false } };

/** Reçu de réservation consultable par son lien secret (e-mail, espace client, QR code). */
export default async function ReservationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <BookingReceipt token={token} methods={onlineMethods()} />;
}
