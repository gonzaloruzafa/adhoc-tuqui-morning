import type { Metadata } from "next";
// import "./globals.css"; // Next.js template defaults usually have this, checking if I need to import explicitely or not. 
// Step 83 I created app/globals.css.
import "./globals.css";

export const metadata: Metadata = {
  title: "Antigravity | Tuqui Morning",
  description: "Tu copiloto de la mañana",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className="bg-gray-50 text-gray-900 antialiased"
      >
        {children}
      </body>
    </html>
  );
}
