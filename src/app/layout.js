import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Calculator PWA",
  description: "A simple calculator Progressive Web App",
  manifest: "/manifest.json", // Link to the web app manifest
  themeColor: "#4a5568",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Calculator PWA",
    // Add more specific icons for iOS if needed
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
