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

// Light is the default theme. Legacy mechanism: class "dark" = light look,
// class "light" = dark look. Only a saved user choice overrides the default.
const themeInit = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t='dark';localStorage.setItem('theme',t);}var c=document.documentElement.classList;c.remove('light','dark');c.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`;

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
