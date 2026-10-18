import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'JomBeelajar · Authentication',
  description: 'Sign in or create an account to access JomBeelajar',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
