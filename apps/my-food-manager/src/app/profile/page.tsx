import type { Metadata } from "next";
import { ProfileScreen } from "@/components/profile/ProfileScreen";

export const metadata: Metadata = { title: "Perfil" };

export default function Page() {
  return <ProfileScreen />;
}
