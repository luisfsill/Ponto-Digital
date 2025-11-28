import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Link from 'next/link';
import { Users, MapPin, FileText } from 'lucide-react';

export default function AdminDashboard() {
    return (
        <ProtectedRoute>
            <AdminDashboardContent />
        </ProtectedRoute>
    );
}

function AdminDashboardContent() {
    const cards = [
        {
            title: 'Usuários',
            description: 'Gerenciar funcionários e vincular dispositivos',
            icon: <Users size={32} />,
            href: '/admin/users',
            color: 'bg-indigo-500',
        },
        {
            title: 'Geofences',
            description: 'Configurar locais permitidos para ponto',
            icon: <MapPin size={32} />,
            href: '/admin/geofences',
            color: 'bg-emerald-500',
        },
        {
            title: 'Registros',
            description: 'Visualizar histórico de pontos',
            icon: <FileText size={32} />,
            href: '/admin/records',
            color: 'bg-blue-500',
        },
    ];

    return (
        <Layout title="Admin Dashboard">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">Painel Administrativo</h1>

                <div className="grid-dashboard">
                    {cards.map((card) => (
                        <Link key={card.href} href={card.href} className="glass-panel card">
                            <div className="card-icon">
                                {card.icon}
                            </div>
                            <h2 className="card-title">
                                {card.title}
                            </h2>
                            <p className="card-desc">
                                {card.description}
                            </p>
                        </Link>
                    ))}
                </div>
            </div>
        </Layout>
    );
}
