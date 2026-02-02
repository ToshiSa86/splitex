import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import Header from "../components/header";
import Providers from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Splitr",
  description: "The smartest way to split expenses with friends",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logos/logo-s.png" sizes="any" />
      </head>
      <body className={inter.className}>
        <Providers>
          <Header />
          <main className="min-h-screen">
            <Toaster richColors />
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
