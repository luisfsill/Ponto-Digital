import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Record } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuthHeaders } from '@/lib/authHeaders';
import { ArrowLeft, Download, Upload } from 'lucide-react';

import { useFeedback } from '@/context/FeedbackContext';

function AdminRecordsContent() {
    const router = useRouter();
    const { showError, showSuccess } = useFeedback();
    const [records, setRecords] = useState<(Record & { users: { name: string } })[]>([]);
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/records', { headers });
            const data = await res.json();
            if (Array.isArray(data)) {
                setRecords(data);
            }
        } catch (error) {
            console.error('Failed to fetch records', error);
            showError('Erro ao carregar registros');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (records.length === 0) {
            showError('Não há registros para exportar');
            return;
        }

        // Create CSV content
        const headers = ['Usuário', 'Data/Hora', 'Latitude', 'Longitude', 'Device ID'];
        const csvContent = [
            headers.join(';'),
            ...records.map(record => [
                record.users?.name || 'Desconhecido',
                format(new Date(record.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
                record.location.lat.toFixed(6),
                record.location.lon.toFixed(6),
                record.device_id
            ].join(';'))
        ].join('\n');

        // Create and download file
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `registros-ponto-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        showSuccess('Registros exportados com sucesso!');
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                showError('Arquivo vazio ou inválido');
                return;
            }

            // Skip header row and parse data
            const dataLines = lines.slice(1);
            const importedRecords: { user_name: string; timestamp: string; lat: number; lon: number; device_id: string }[] = [];

            for (const line of dataLines) {
                const parts = line.split(';');
                if (parts.length >= 5) {
                    const [userName, dateTime, lat, lon, deviceId] = parts;
                    
                    // Parse date (dd/MM/yyyy HH:mm:ss)
                    const [datePart, timePart] = dateTime.split(' ');
                    const [day, month, year] = datePart.split('/');
                    const isoDate = `${year}-${month}-${day}T${timePart}`;
                    
                    importedRecords.push({
                        user_name: userName.trim(),
                        timestamp: isoDate,
                        lat: parseFloat(lat),
                        lon: parseFloat(lon),
                        device_id: deviceId.trim()
                    });
                }
            }

            if (importedRecords.length === 0) {
                showError('Nenhum registro válido encontrado no arquivo');
                return;
            }

            // Send to API
            const headers = await getAuthHeaders();
            const res = await fetch('/api/records', {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ records: importedRecords }),
            });

            if (res.ok) {
                const result = await res.json();
                showSuccess(`${result.imported || importedRecords.length} registros importados com sucesso!`);
                fetchRecords();
            } else {
                const error = await res.json();
                showError(`Erro ao importar: ${error.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Failed to import records', error);
            showError('Erro ao processar arquivo');
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Layout title="Registros de Ponto">
            <div className="mb-8">
                <button
                    onClick={() => router.push('/admin')}
                    className="btn btn-outline mb-4"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={18} />
                    Voltar
                </button>

                <div className="flex-between mb-8">
                    <h1 className="text-2xl font-bold">Histórico de Pontos</h1>
                    <div className="btn-group">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".csv"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-outline"
                            title="Importar CSV"
                        >
                            <Upload size={18} />
                            <span className="btn-text-mobile">Importar</span>
                        </button>
                        <button
                            onClick={handleExport}
                            className="btn btn-primary"
                            title="Exportar CSV"
                        >
                            <Download size={18} />
                            <span className="btn-text-mobile">Exportar</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <p className="text-muted">Carregando...</p>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Funcionário</th>
                                    <th>Data/Hora</th>
                                    <th>Localização</th>
                                    <th>Device ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record) => (
                                    <tr key={record.id}>
                                        <td style={{ fontWeight: 500 }}>{record.users?.name || 'Desconhecido'}</td>
                                        <td>
                                            {format(new Date(record.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                        </td>
                                        <td className="text-sm text-muted">
                                            {record.location.lat.toFixed(5)}, {record.location.lon.toFixed(5)}
                                        </td>
                                        <td className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>
                                            {record.device_id.substring(0, 8)}...
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default function AdminRecords() {
    return (
        <ProtectedRoute>
            <AdminRecordsContent />
        </ProtectedRoute>
    );
}
