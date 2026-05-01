import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces, Playfair_Display } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fraunces — display serif heredado v4 (lo dejamos por si otras pages
// lo siguen usando). Pesos 400/600/700 + italic.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Playfair Display — display serif del rediseño v5 (Lovable hue-learn-glow).
// Es la fuente que da el carácter teatral al "cherito" italic gradient.
// Pesos 600/700 (h1) + italic 600 ("cherito"). Display swap para no FOIT.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  display: "swap",
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
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${playfair.variable} h-full antialiased`}
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
