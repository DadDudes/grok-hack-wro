import type { Metadata, Viewport } from 'next';
import { Figtree, Fredoka } from 'next/font/google';
import type { ReactNode } from 'react';
import { FlowProvider } from '@/components/state/FlowProvider';
import '@/styles/tokens.css';
import '@/styles/globals.css';

const fredoka = Fredoka({
  subsets: ['latin'],
  variable: '--font-fredoka',
  display: 'swap',
});

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'EduBotGames',
    template: '%s · EduBotGames',
  },
  description: 'Parents pick the topic. Kids pick the game.',
};

export const viewport: Viewport = {
  themeColor: '#0A7D73',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const fontClasses = `${fredoka.variable} ${figtree.variable}`;

  return (
    <html lang="en" className={fontClasses}>
      <body>
        <FlowProvider>{children}</FlowProvider>
      </body>
    </html>
  );
}
