import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="pt-BR">
      <Head>
        {/* PWA Meta Tags */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Ponto Digital" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
