import '@/styles/globals.css';
// App root component
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { FeedbackProvider } from '@/context/FeedbackContext';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function App({ Component, pageProps, router }: AppProps) {
  const isAdminRoute = router.pathname.startsWith('/admin');

  // Registrar Service Worker para PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado:', registration.scope);
        })
        .catch((error) => {
          console.error('❌ Erro ao registrar Service Worker:', error);
        });
    }
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <FeedbackProvider>
          {isAdminRoute ? (
            <ProtectedRoute>
              <Component {...pageProps} />
            </ProtectedRoute>
          ) : (
            <Component {...pageProps} />
          )}
        </FeedbackProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
