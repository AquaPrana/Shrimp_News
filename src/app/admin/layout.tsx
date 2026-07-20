/**
 * Admin section shell. Login lives at /admin/login (outside (dashboard)).
 * Auth for dashboard routes is enforced in (dashboard)/layout.tsx.
 */
export default function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
