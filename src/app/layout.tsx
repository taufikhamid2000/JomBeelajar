import '../styles/globals.css';
import Providers from '@/components/Providers';
import ErrorBoundary from '@/components/ErrorBoundary';
import { validateEnvironment } from '@/lib/env-check';

// Validate environment variables on startup
validateEnvironment();

export const metadata = {
  title: 'JomBeelajar - Learn, Earn, Grow',
  description:
    'Empowering students and educators with tools to learn, earn and grow.',
};

// Fix the viewport warning by using the correct export
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Light is the default. <html class="dark"> enables the dark look; only a
// saved user choice (key "jb-theme") overrides it.
const themeInit = `(function(){try{if(localStorage.getItem('jb-theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <Providers>
          <ErrorBoundary>{children}</ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
