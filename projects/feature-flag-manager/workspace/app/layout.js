export const metadata = {
  title: "Feature Flag Manager",
  description: "Self‑hosted feature flag management"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className="h-full">{children}</body>
    </html>
  );
}
