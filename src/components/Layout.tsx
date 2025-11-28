import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Moon, Sun, LogOut, User, Shield, Home } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function Layout({ children, title = 'Ponto Digital' }: LayoutProps) {
    const { theme, toggleTheme, mounted } = useTheme();
    const { user, signOut } = useAuth();
    const router = useRouter();
    const isAdminPage = router.pathname.startsWith('/admin');
    const isLoginPage = router.pathname === '/login';

    return (
        <>
            <Head>
                <title>{title}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <div className="app-container">
                <header className="app-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'center', width: '100%' }}>
                        {/* Botão Home - visível na página de login */}
                        {isLoginPage && (
                            <Link
                                href="/"
                                className="btn btn-outline"
                                style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Home size={18} />
                                <span>Home</span>
                            </Link>
                        )}
                        {user && isAdminPage && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                <User size={16} className="text-muted" />
                                <span className="text-sm text-muted">{user.email}</span>
                            </div>
                        )}
                        {/* Botão Área Administrativa - visível quando não está em /admin e não está em /login */}
                        {!isAdminPage && !isLoginPage && (
                            <Link
                                href="/admin"
                                className="btn btn-outline"
                                style={{ padding: '0.5rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <Shield size={18} />
                                <span>Admin</span>
                            </Link>
                        )}
                        {/* Toggle Theme - sempre visível */}
                        <button
                            onClick={toggleTheme}
                            className="btn btn-outline"
                            style={{ padding: '0.5rem' }}
                            aria-label="Toggle Theme"
                        >
                            {mounted && (theme === 'light' ? <Moon size={18} /> : <Sun size={18} />)}
                        </button>
                        {user && isAdminPage && (
                            <button
                                onClick={signOut}
                                className="btn btn-outline"
                                style={{ padding: '0.5rem 1rem' }}
                                title="Sair"
                            >
                                <LogOut size={18} />
                                <span style={{ marginLeft: '0.5rem' }}>Sair</span>
                            </button>
                        )}
                    </div>
                </header>
                <main className="main-content">
                    {children}
                </main>
                    <footer className="text-center py-6 text-sm text-muted">
                        &copy; {new Date().getFullYear()} Ponto Digital
                    </footer>
            </div>
        </>
    );
}
