// app/print/layout.tsx
export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, background: "#f4f4f0" }}>
        {children}
      </body>
    </html>
  );
}
