import { DashboardLayout } from '@/features/dashboard/components/dashboard-layout';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
