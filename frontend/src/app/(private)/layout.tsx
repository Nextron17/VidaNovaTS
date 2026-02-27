import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { UserProvider } from "@/src/app/context/UserContext";
// 👇 IMPORTAMOS EL COMPONENTE DE SEGURIDAD
import IdleLogout from "@/src/app/components/IdleLogout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ecosistema Vidanova",
  description: "Gestión Integral de Rutas Oncológicas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <UserProvider>
          {/* 👇 ACTIVAMOS LA PROTECCIÓN GLOBAL */}
          <IdleLogout />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}