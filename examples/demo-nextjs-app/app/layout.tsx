import type { ReactNode } from "react";

export const metadata = {
  title: "Demo: existing upload flow + bg-remove-core",
};

export default function RootLayout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
