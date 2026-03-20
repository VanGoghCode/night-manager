import "./globals.css";
import type { Metadata } from "next";
import { AppShell } from "@night-manager/ui";
import { loadWebEnvironment } from "@night-manager/config";

const env = loadWebEnvironment();

export const metadata: Metadata = {
  title: "Night Manager",
  description: "AI-native software delivery operating system"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body data-app-url={env.NEXT_PUBLIC_APP_URL}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
