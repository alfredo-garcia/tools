import type { Metadata } from "next";
import { Refrigerator } from "lucide-react";
import { TmpComingSoon } from "@/components/feedback/TmpComingSoon";

export const metadata: Metadata = { title: "Despensa" };

export default function Page() {
  return <TmpComingSoon icon={Refrigerator} title="Despensa" />;
}
