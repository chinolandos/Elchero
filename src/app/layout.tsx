import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Poppins — única tipografía del sitio.
// 300 (Light) para texto chico/cuerpo, 400 (Regular) para titulares y bold.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://elchero.app"),
  title: "El Chero — apuntes con IA, hechos a tu medida",
  description:
    "Subí o grabá el audio de tu clase y recibí apuntes en español salvadoreño con preguntas tipo examen, flashcards y audio para repasar. Hecho para AVANZO, parciales universitarios y pruebas de período del bachillerato.",
  keywords: [
    "AVANZO",
    "apuntes IA",
    "El Salvador",
    "ESEN",
    "UCA",
    "UES",
    "estudiantes salvadoreños",
    "parciales universitarios",
    "bachillerato",
  ],
  authors: [{ name: "Equipo Chero" }],
  openGraph: {
    title: "El Chero — apuntes con IA, hechos a tu medida",
    description:
      "Apuntes inteligentes en español salvadoreño para AVANZO, parciales universitarios y pruebas de período.",
    url: "https://elchero.app",
    siteName: "El Chero",
    locale: "es_SV",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-SV"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1e1e2e',
              border: '1px solid rgba(147, 51, 234, 0.3)',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
