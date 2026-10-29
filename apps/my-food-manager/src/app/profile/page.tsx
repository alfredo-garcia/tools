import type { Metadata } from "next";
import { User } from "lucide-react";
import { TmpComingSoon } from "@/components/feedback/TmpComingSoon";

export const metadata: Metadata = { title: "Perfil" };

export default function Page() {
  return <TmpComingSoon icon={User} title="Perfil" />;
}
