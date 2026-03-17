import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { CartProvider } from "~/context/cart-context";
import { CartIcon } from "~/components/cart-icon";

export const metadata: Metadata = {
  title: "Evo2 Variant Analysis",
  description: "Evo2 Variant Analysis",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <CartProvider>
          {children}
          <CartIcon />
        </CartProvider>
      </body>
    </html>
  );
}
