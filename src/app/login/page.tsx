import type { Metadata } from "next";
import { LoginView } from "@/components/login/LoginView";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return <LoginView />;
}
