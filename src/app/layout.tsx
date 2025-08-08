import "@/styles/globals.css";

import { type Metadata } from "next";
import { Roboto } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";

export const metadata: Metadata = {
  title: "DRIP-MA ULTIMATE TEMPLATE",
  description: "DRIP-MA ULTIMATE TEMPLATE",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const roboto = Roboto({
  variable: "--font-roboto-sans",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${roboto.variable}`}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
