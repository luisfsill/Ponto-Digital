import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Eye, EyeOff, AlertCircle, Moon, Sun } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const { signIn, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        // Redirect if already logged in
        if (user) {
            router.push('/admin');
        }
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const { error: signInError } = await signIn(email, password);

        if (signInError) {
            setError('Email ou senha inválidos');
            setLoading(false);
        } else {
            router.push('/admin');
        }
    };

    return (
        <>
            <Head>
                <title>Login - Ponto Digital</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <div className="login-page">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="theme-toggle"
                    aria-label="Toggle Theme"
                >
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>

                <div className="login-container fade-in-up">
                    <div className="login-header">
                        <h1 className="login-title">
                            Bem-vindo de volta
                            <span className="login-emoji" role="img" aria-label="wave">👋</span>
                        </h1>
                        <p className="login-subtitle">
                            Entre com suas credenciais para acessar o painel
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="input-group">
                            <label className="label" htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input"
                                placeholder="seu@email.com"
                                required
                                autoFocus
                                autoComplete="email"
                            />
                        </div>

                        <div className="input-group">
                            <label className="label" htmlFor="password">Senha</label>
                            <div className="input-password-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input input-password"
                                    placeholder="••••••••"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="password-toggle"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} className="text-muted" />
                                    ) : (
                                        <Eye size={20} className="text-muted" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="login-options">
                            <label className="checkbox-wrapper">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="checkbox"
                                />
                                <span className="checkbox-label">Lembrar de mim</span>
                            </label>
                            <a href="#" className="forgot-password">
                                Esqueceu a senha?
                            </a>
                        </div>

                        {error && (
                            <div className="alert alert-error">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary w-full login-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="loading-text">
                                    <span className="spinner"></span>
                                    Entrando...
                                </span>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <span className="text-muted">Ponto Digital</span>
                    </div>
                </div>
            </div>
        </>
    );
}
