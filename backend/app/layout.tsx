import type { ReactNode } from 'react';

export const metadata = {
  title: 'Developer test — games API',
  description: 'Temporary page for trying POST /api/games. Not the product frontend.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <style>{`
          body {
            font-family: ui-sans-serif, system-ui, sans-serif;
            margin: 1.5rem;
            max-width: 70rem;
            color: #111;
          }
          label { display: block; margin: 0.75rem 0 0.25rem; }
          input, textarea, button { font: inherit; }
          input, textarea { width: 100%; box-sizing: border-box; }
          textarea { min-height: 5rem; }
          button { margin-top: 1rem; }
          pre { overflow: auto; padding: 0.75rem; background: #f3f3f3; }
          img { max-width: 100%; height: auto; background: #f3f3f3; }
          iframe { width: 100%; height: 70vh; border: 1px solid #ccc; margin-top: 0.5rem; background: #111; }
        `}</style>
        {children}
      </body>
    </html>
  );
}
