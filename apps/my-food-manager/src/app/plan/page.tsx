import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";
import { TmpComingSoon } from "@/components/feedback/TmpComingSoon";

export const metadata: Metadata = { title: "Plan" };

export default function Page() {
  return <TmpComingSoon icon={CalendarDays} title="Plan" />;
}
