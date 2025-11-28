import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Record, RecordType, DailyWorkSummary } from '@/types';
import { format, parseISO, differenceInMinutes, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getAuthHeaders } from '@/lib/authHeaders';
import { ArrowLeft, Download, Upload, Clock, TrendingUp, TrendingDown, Minus, LogIn, LogOut, Search, Filter, X, Calendar, User } from 'lucide-react';
import * as XLSX from 'xlsx';

import { useFeedback } from '@/context/FeedbackContext';

function AdminRecordsContent() {
    const router = useRouter();
    const { showError, showSuccess } = useFeedback();
    const [records, setRecords] = useState<(Record & { users: { name: string } })[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'records' | 'summary'>('records');
    const [dailySummaries, setDailySummaries] = useState<DailyWorkSummary[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Estados de busca e filtro
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEmployee, setFilterEmployee] = useState<string>('all');
    const [filterType, setFilterType] = useState<'all' | 'entrada' | 'saida'>('all');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Configuração de horas esperadas por dia (em minutos) - 8 horas = 480 minutos
    const EXPECTED_WORK_MINUTES = 480;

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/records', { headers });
            const data = await res.json();
            if (Array.isArray(data)) {
                // Processar registros para determinar entrada/saída
                const processedRecords = processRecordTypes(data);
                setRecords(processedRecords);
                
                // Calcular resumos diários
                const summaries = calculateDailySummaries(processedRecords);
                setDailySummaries(summaries);
            }
        } catch (error) {
            console.error('Failed to fetch records', error);
            showError('Erro ao carregar registros');
        } finally {
            setLoading(false);
        }
    };

    // Processa os registros para determinar se cada um é entrada ou saída
    const processRecordTypes = (rawRecords: (Record & { users: { name: string } })[]): (Record & { users: { name: string } })[] => {
        // Agrupar por usuário e data
        const groupedByUserAndDate: { [key: string]: (Record & { users: { name: string } })[] } = {};

        rawRecords.forEach(record => {
            const date = format(parseISO(record.timestamp), 'yyyy-MM-dd');
            const key = `${record.user_id}-${date}`;
            
            if (!groupedByUserAndDate[key]) {
                groupedByUserAndDate[key] = [];
            }
            groupedByUserAndDate[key].push(record);
        });

        // Para cada grupo, ordenar por hora e alternar entrada/saída
        Object.values(groupedByUserAndDate).forEach(userDayRecords => {
            // Ordenar por timestamp
            userDayRecords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            // Alternar: primeiro é entrada, segundo é saída, etc.
            userDayRecords.forEach((record, index) => {
                record.record_type = index % 2 === 0 ? 'entrada' : 'saida';
            });
        });

        // Reordenar todos os registros por timestamp decrescente para exibição
        return rawRecords.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    // Calcula o resumo diário de horas trabalhadas
    const calculateDailySummaries = (processedRecords: (Record & { users: { name: string } })[]): DailyWorkSummary[] => {
        const groupedByUserAndDate: { [key: string]: (Record & { users: { name: string } })[] } = {};

        processedRecords.forEach(record => {
            const date = format(parseISO(record.timestamp), 'yyyy-MM-dd');
            const key = `${record.user_id}-${date}`;
            
            if (!groupedByUserAndDate[key]) {
                groupedByUserAndDate[key] = [];
            }
            groupedByUserAndDate[key].push(record);
        });

        const summaries: DailyWorkSummary[] = [];

        Object.entries(groupedByUserAndDate).forEach(([, userDayRecords]) => {
            // Ordenar por timestamp
            userDayRecords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

            const date = format(parseISO(userDayRecords[0].timestamp), 'yyyy-MM-dd');
            const userName = userDayRecords[0].users?.name || 'Desconhecido';
            const userId = userDayRecords[0].user_id;

            const recordsList: { time: string; type: RecordType }[] = [];
            let totalWorkedMinutes = 0;

            // Calcular horas trabalhadas por pares (entrada-saída)
            for (let i = 0; i < userDayRecords.length; i += 2) {
                const entrada = userDayRecords[i];
                const saida = userDayRecords[i + 1];

                recordsList.push({
                    time: format(parseISO(entrada.timestamp), 'HH:mm'),
                    type: 'entrada'
                });

                if (saida) {
                    recordsList.push({
                        time: format(parseISO(saida.timestamp), 'HH:mm'),
                        type: 'saida'
                    });

                    // Calcular minutos trabalhados neste período
                    const workedMinutes = differenceInMinutes(
                        parseISO(saida.timestamp),
                        parseISO(entrada.timestamp)
                    );
                    totalWorkedMinutes += workedMinutes;
                }
            }

            summaries.push({
                date,
                userName,
                userId,
                records: recordsList,
                totalWorkedMinutes,
                expectedMinutes: EXPECTED_WORK_MINUTES,
                balanceMinutes: totalWorkedMinutes - EXPECTED_WORK_MINUTES
            });
        });

        // Ordenar por data decrescente
        return summaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const formatMinutesToHours = (minutes: number): string => {
        const hours = Math.floor(Math.abs(minutes) / 60);
        const mins = Math.abs(minutes) % 60;
        const sign = minutes < 0 ? '-' : '+';
        return `${sign}${hours}h${mins.toString().padStart(2, '0')}min`;
    };

    const formatWorkedTime = (minutes: number): string => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h${mins.toString().padStart(2, '0')}min`;
    };

    // Calcular banco de horas total por funcionário
    const calculateTotalBankHours = () => {
        const bankByUser: { [userId: string]: { name: string; totalBalance: number } } = {};

        dailySummaries.forEach(summary => {
            if (!bankByUser[summary.userId]) {
                bankByUser[summary.userId] = { name: summary.userName, totalBalance: 0 };
            }
            bankByUser[summary.userId].totalBalance += summary.balanceMinutes;
        });

        return Object.values(bankByUser);
    };

    const handleExport = () => {
        if (filteredRecords.length === 0) {
            showError('Não há registros para exportar');
            return;
        }

        // Criar dados para a planilha de registros
        const registrosData = filteredRecords.map(record => ({
            'Funcionário': record.users?.name || 'Desconhecido',
            'Data': format(new Date(record.timestamp), "dd/MM/yyyy", { locale: ptBR }),
            'Hora': format(new Date(record.timestamp), "HH:mm:ss", { locale: ptBR }),
            'Tipo': record.record_type === 'entrada' ? 'Entrada' : 'Saída'
        }));

        // Criar dados para a planilha de resumo diário
        const resumoData = filteredSummaries.map(summary => ({
            'Data': format(parseISO(summary.date), "dd/MM/yyyy", { locale: ptBR }),
            'Funcionário': summary.userName,
            'Registros': summary.records.map(r => `${r.type === 'entrada' ? '→' : '←'} ${r.time}`).join(' | '),
            'Horas Trabalhadas': formatWorkedTime(summary.totalWorkedMinutes),
            'Saldo': formatMinutesToHours(summary.balanceMinutes)
        }));

        // Criar dados para a planilha de banco de horas
        const bancoHorasData = filteredBankHours.map(user => ({
            'Funcionário': user.name,
            'Saldo Total': formatMinutesToHours(user.totalBalance)
        }));

        // Criar workbook com múltiplas abas
        const wb = XLSX.utils.book_new();

        // Aba de Registros
        const wsRegistros = XLSX.utils.json_to_sheet(registrosData);
        wsRegistros['!cols'] = [{ wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, wsRegistros, 'Registros');

        // Aba de Resumo Diário
        const wsResumo = XLSX.utils.json_to_sheet(resumoData);
        wsResumo['!cols'] = [{ wch: 12 }, { wch: 25 }, { wch: 40 }, { wch: 18 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Diário');

        // Aba de Banco de Horas
        const wsBanco = XLSX.utils.json_to_sheet(bancoHorasData);
        wsBanco['!cols'] = [{ wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsBanco, 'Banco de Horas');

        // Gerar arquivo e fazer download
        XLSX.writeFile(wb, `registros-ponto-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.xlsx`);
        
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
            const importedRecords: { user_name: string; timestamp: string; record_type: string }[] = [];

            for (const line of dataLines) {
                const parts = line.split(';');
                if (parts.length >= 3) {
                    const [userName, dateTime, tipo] = parts;
                    
                    // Parse date (dd/MM/yyyy HH:mm:ss)
                    const [datePart, timePart] = dateTime.split(' ');
                    const [day, month, year] = datePart.split('/');
                    const isoDate = `${year}-${month}-${day}T${timePart}`;
                    
                    importedRecords.push({
                        user_name: userName.trim(),
                        timestamp: isoDate,
                        record_type: tipo.toLowerCase().includes('entrada') ? 'entrada' : 'saida'
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

    const bankHours = calculateTotalBankHours();

    // Lista única de funcionários para o filtro
    const uniqueEmployees = useMemo(() => {
        const employees = new Map<string, string>();
        records.forEach(record => {
            if (record.users?.name && record.user_id) {
                employees.set(record.user_id, record.users.name);
            }
        });
        return Array.from(employees.entries()).map(([id, name]) => ({ id, name }));
    }, [records]);

    // Filtrar registros
    const filteredRecords = useMemo(() => {
        return records.filter(record => {
            // Filtro por busca (nome do funcionário)
            if (searchTerm) {
                const name = record.users?.name?.toLowerCase() || '';
                if (!name.includes(searchTerm.toLowerCase())) {
                    return false;
                }
            }

            // Filtro por funcionário
            if (filterEmployee !== 'all' && record.user_id !== filterEmployee) {
                return false;
            }

            // Filtro por tipo (entrada/saída)
            if (filterType !== 'all' && record.record_type !== filterType) {
                return false;
            }

            // Filtro por data
            if (filterDateStart || filterDateEnd) {
                const recordDate = parseISO(record.timestamp);
                
                if (filterDateStart) {
                    const startDate = startOfDay(parseISO(filterDateStart));
                    if (recordDate < startDate) return false;
                }
                
                if (filterDateEnd) {
                    const endDate = endOfDay(parseISO(filterDateEnd));
                    if (recordDate > endDate) return false;
                }
            }

            return true;
        });
    }, [records, searchTerm, filterEmployee, filterType, filterDateStart, filterDateEnd]);

    // Filtrar resumos diários
    const filteredSummaries = useMemo(() => {
        return dailySummaries.filter(summary => {
            // Filtro por busca (nome do funcionário)
            if (searchTerm) {
                if (!summary.userName.toLowerCase().includes(searchTerm.toLowerCase())) {
                    return false;
                }
            }

            // Filtro por funcionário
            if (filterEmployee !== 'all' && summary.userId !== filterEmployee) {
                return false;
            }

            // Filtro por data
            if (filterDateStart || filterDateEnd) {
                const summaryDate = parseISO(summary.date);
                
                if (filterDateStart) {
                    const startDate = startOfDay(parseISO(filterDateStart));
                    if (summaryDate < startDate) return false;
                }
                
                if (filterDateEnd) {
                    const endDate = endOfDay(parseISO(filterDateEnd));
                    if (summaryDate > endDate) return false;
                }
            }

            return true;
        });
    }, [dailySummaries, searchTerm, filterEmployee, filterDateStart, filterDateEnd]);

    // Calcular banco de horas filtrado
    const filteredBankHours = useMemo(() => {
        const bankByUser: { [userId: string]: { name: string; totalBalance: number } } = {};

        filteredSummaries.forEach(summary => {
            if (!bankByUser[summary.userId]) {
                bankByUser[summary.userId] = { name: summary.userName, totalBalance: 0 };
            }
            bankByUser[summary.userId].totalBalance += summary.balanceMinutes;
        });

        return Object.values(bankByUser);
    }, [filteredSummaries]);

    // Limpar todos os filtros
    const clearFilters = () => {
        setSearchTerm('');
        setFilterEmployee('all');
        setFilterType('all');
        setFilterDateStart('');
        setFilterDateEnd('');
    };

    // Verificar se há filtros ativos
    const hasActiveFilters = searchTerm || filterEmployee !== 'all' || filterType !== 'all' || filterDateStart || filterDateEnd;

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

                <div className="flex-between mb-4">
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

                {/* Toggle View Mode */}
                <div className="btn-group mb-4" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setViewMode('records')}
                        className={`btn ${viewMode === 'records' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        <Clock size={18} />
                        Registros
                    </button>
                    <button
                        onClick={() => setViewMode('summary')}
                        className={`btn ${viewMode === 'summary' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        <TrendingUp size={18} />
                        Banco de Horas
                    </button>
                </div>

                {/* Barra de Busca e Filtros */}
                <div className="glass-panel mb-6" style={{ padding: '1rem' }}>
                    {/* Linha principal: Busca + Botão de Filtros */}
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Campo de Busca */}
                        <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
                            <Search 
                                size={18} 
                                style={{ 
                                    position: 'absolute', 
                                    left: '0.75rem', 
                                    top: '50%', 
                                    transform: 'translateY(-50%)',
                                    opacity: 0.5
                                }} 
                            />
                            <input
                                type="text"
                                placeholder="Buscar por nome do funcionário..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input"
                                style={{ paddingLeft: '2.5rem', marginBottom: 0 }}
                            />
                        </div>

                        {/* Botão Mostrar/Ocultar Filtros */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`btn ${showFilters || hasActiveFilters ? 'btn-primary' : 'btn-outline'}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Filter size={18} />
                            Filtros
                            {hasActiveFilters && (
                                <span 
                                    style={{ 
                                        background: 'rgba(255,255,255,0.2)', 
                                        borderRadius: '50%', 
                                        width: '20px', 
                                        height: '20px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    !
                                </span>
                            )}
                        </button>

                        {/* Botão Limpar Filtros */}
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="btn btn-outline"
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                title="Limpar filtros"
                            >
                                <X size={18} />
                                Limpar
                            </button>
                        )}
                    </div>

                    {/* Painel de Filtros Expandido */}
                    {showFilters && (
                        <div 
                            style={{ 
                                marginTop: '1rem', 
                                paddingTop: '1rem', 
                                borderTop: '1px solid var(--border)',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                gap: '1rem'
                            }}
                        >
                            {/* Filtro por Funcionário */}
                            <div>
                                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <User size={14} />
                                    Funcionário
                                </label>
                                <select
                                    value={filterEmployee}
                                    onChange={(e) => setFilterEmployee(e.target.value)}
                                    className="input"
                                    style={{ marginBottom: 0 }}
                                >
                                    <option value="all">Todos</option>
                                    {uniqueEmployees.map(emp => (
                                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por Tipo (apenas na aba Registros) */}
                            {viewMode === 'records' && (
                                <div>
                                    <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <LogIn size={14} />
                                        Tipo
                                    </label>
                                    <select
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value as 'all' | 'entrada' | 'saida')}
                                        className="input"
                                        style={{ marginBottom: 0 }}
                                    >
                                        <option value="all">Todos</option>
                                        <option value="entrada">Entrada</option>
                                        <option value="saida">Saída</option>
                                    </select>
                                </div>
                            )}

                            {/* Filtro por Data Início */}
                            <div>
                                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={14} />
                                    Data Início
                                </label>
                                <input
                                    type="date"
                                    value={filterDateStart}
                                    onChange={(e) => setFilterDateStart(e.target.value)}
                                    className="input"
                                    style={{ marginBottom: 0 }}
                                />
                            </div>

                            {/* Filtro por Data Fim */}
                            <div>
                                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Calendar size={14} />
                                    Data Fim
                                </label>
                                <input
                                    type="date"
                                    value={filterDateEnd}
                                    onChange={(e) => setFilterDateEnd(e.target.value)}
                                    className="input"
                                    style={{ marginBottom: 0 }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Contador de resultados */}
                    {hasActiveFilters && (
                        <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }} className="text-muted">
                            {viewMode === 'records' 
                                ? `${filteredRecords.length} registro(s) encontrado(s)`
                                : `${filteredSummaries.length} dia(s) encontrado(s)`
                            }
                        </div>
                    )}
                </div>

                {loading ? (
                    <p className="text-muted">Carregando...</p>
                ) : viewMode === 'records' ? (
                    /* Visualização de Registros */
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Funcionário</th>
                                    <th>Data/Hora</th>
                                    <th>Tipo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                                            Nenhum registro encontrado
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((record) => (
                                        <tr key={record.id}>
                                            <td style={{ fontWeight: 500 }}>{record.users?.name || 'Desconhecido'}</td>
                                            <td>
                                                {format(new Date(record.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                            </td>
                                            <td>
                                                <span 
                                                    className={`badge ${record.record_type === 'entrada' ? 'badge-success' : 'badge-warning'}`}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                                                >
                                                    {record.record_type === 'entrada' ? (
                                                        <><LogIn size={14} /> Entrada</>
                                                    ) : (
                                                        <><LogOut size={14} /> Saída</>
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    /* Visualização de Banco de Horas */
                    <div>
                        {/* Cards de Banco de Horas Total por Funcionário */}
                        <div className="mb-6">
                            <h2 className="text-lg font-bold mb-4">Saldo Total de Horas</h2>
                            {filteredBankHours.length === 0 ? (
                                <div className="glass-panel text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
                                    Nenhum dado encontrado
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                                    {filteredBankHours.map((user, idx) => (
                                        <div key={idx} className="glass-panel" style={{ padding: '1.25rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <h3 className="font-bold">{user.name}</h3>
                                                    <p className="text-sm text-muted">Banco de Horas</p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {user.totalBalance > 0 ? (
                                                        <TrendingUp size={20} className="text-success" />
                                                    ) : user.totalBalance < 0 ? (
                                                        <TrendingDown size={20} className="text-error" />
                                                    ) : (
                                                        <Minus size={20} className="text-muted" />
                                                    )}
                                                    <span 
                                                        className={`text-lg font-bold ${
                                                            user.totalBalance > 0 ? 'text-success' : 
                                                            user.totalBalance < 0 ? 'text-error' : 'text-muted'
                                                        }`}
                                                    >
                                                        {formatMinutesToHours(user.totalBalance)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Tabela de Resumo Diário */}
                        <h2 className="text-lg font-bold mb-4">Resumo Diário</h2>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Funcionário</th>
                                        <th>Registros</th>
                                        <th>Trabalhado</th>
                                        <th>Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSummaries.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                                                Nenhum resumo encontrado
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredSummaries.map((summary, idx) => (
                                            <tr key={idx}>
                                                <td style={{ fontWeight: 500 }}>
                                                    {format(parseISO(summary.date), "dd/MM/yyyy", { locale: ptBR })}
                                                </td>
                                                <td>{summary.userName}</td>
                                                <td>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                                        {summary.records.map((rec, i) => (
                                                            <span 
                                                                key={i}
                                                                className={`badge ${rec.type === 'entrada' ? 'badge-success' : 'badge-warning'}`}
                                                                style={{ fontSize: '0.7rem' }}
                                                            >
                                                                {rec.type === 'entrada' ? '→' : '←'} {rec.time}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="font-medium">
                                                        {formatWorkedTime(summary.totalWorkedMinutes)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span 
                                                        className={`font-bold ${
                                                            summary.balanceMinutes > 0 ? 'text-success' : 
                                                            summary.balanceMinutes < 0 ? 'text-error' : 'text-muted'
                                                        }`}
                                                    >
                                                        {formatMinutesToHours(summary.balanceMinutes)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
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
