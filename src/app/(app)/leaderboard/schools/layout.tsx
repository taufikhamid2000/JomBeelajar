import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School Rankings | JomBeelajar',
  description:
    'View top performing schools in JomBeelajar platform across different categories and regions',
};

export default function SchoolLeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
