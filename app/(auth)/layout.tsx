export default function AuthLayout({
  children,
  navigation,
  sidebar,
}: {
  children: React.ReactNode;
  navigation?: React.ReactNode;
  sidebar?: React.ReactNode;
}) {
  // Auth layout explicitly doesn't render navigation/sidebar
  // This ensures auth pages are completely standalone
  return (
    <>
      {children}
    </>
  );
}
