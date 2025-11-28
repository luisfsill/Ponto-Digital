import Layout from '@/components/Layout';
import Link from 'next/link';
import { Smartphone } from 'lucide-react';

export default function Home() {
  return (
    <Layout>
      <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', textAlign: 'center', gap: '2rem' }}>
        <div style={{ marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', color: 'transparent', marginBottom: '1rem' }}>
            Ponto Digital
          </h1>
          <p className="text-muted" style={{ fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto' }}>
            Sistema de registro de ponto com identificação de dispositivo e geolocalização.
          </p>
        </div>

        <Link href="/ponto" className="glass-panel card" style={{ borderColor: 'var(--secondary)', maxWidth: '400px', width: '100%' }}>
          <div className="card-icon" style={{ color: 'var(--secondary)', background: 'rgba(168, 85, 247, 0.1)' }}>
            <Smartphone size={40} />
          </div>
          <h2 className="card-title" style={{ fontSize: '1.5rem' }}>Registrar Ponto</h2>
          <p className="card-desc">
            Acesso para funcionários registrarem entrada/saída.
          </p>
        </Link>
      </div>
    </Layout>
  );
}
