import "./globals.css";
import StyledComponentsRegistry from "@/lib/registry";

export const metadata = {
  title: "WIMB SHOWROOM",
  description: "WIMB SHOWROOM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  );
}
