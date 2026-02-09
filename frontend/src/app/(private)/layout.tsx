import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
// 👇 1. IMPORTAMOS EL PROVIDER (Asegúrate que la ruta coincida con donde lo guardaste)
import { UserProvider } from "@/src/app/context/UserContext";

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
        {/* 👇 2. ENVOLVEMOS TODO (children) CON EL PROVIDER */}
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}