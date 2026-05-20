import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import ProvedorSessao from "@/components/providers/ProvedorSessao";
import { ProvedorTema } from "@/components/providers/ProvedorTema";
import { ProvedorAcademico } from "@/components/providers/ProvedorAcademico";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Minha UEM",
  description: "Plataforma para estudantes da UEM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ProvedorTema
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ProvedorSessao>
            <ProvedorAcademico>
              {children}
            </ProvedorAcademico>
          </ProvedorSessao>
        </ProvedorTema>
      </body>
    </html>
  );
}
