import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Geofence } from '@/types';
import { MapPin, Plus, X, ArrowLeft, QrCode, Download, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/authHeaders';
import { QRCodeSVG } from 'qrcode.react';

import { useFeedback } from '@/context/FeedbackContext';

export default function AdminGeofences() {
    return (
        <ProtectedRoute>
            <AdminGeofencesContent />
        </ProtectedRoute>
    );
}

function AdminGeofencesContent() {
    const router = useRouter();
    const { showSuccess, showError, showConfirm } = useFeedback();
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedGeofenceForQR, setSelectedGeofenceForQR] = useState<Geofence | null>(null);
    const [selectedGeofenceForEdit, setSelectedGeofenceForEdit] = useState<Geofence | null>(null);
    const qrRef = useRef<HTMLDivElement>(null);

    // Form state
    const [name, setName] = useState('');
    const [lat, setLat] = useState('');
    const [lon, setLon] = useState('');
    const [radius, setRadius] = useState('100');
    const [gettingLocation, setGettingLocation] = useState(false);

    // Edit form state
    const [editName, setEditName] = useState('');
    const [editLat, setEditLat] = useState('');
    const [editLon, setEditLon] = useState('');
    const [editRadius, setEditRadius] = useState('');
    const [gettingEditLocation, setGettingEditLocation] = useState(false);

    useEffect(() => {
        fetchGeofences();
    }, []);

    const fetchGeofences = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/geofences', { headers });
            const data = await res.json();
            if (Array.isArray(data)) {
                setGeofences(data);
            }
        } catch (error) {
            console.error('Failed to fetch geofences', error);
            showError('Erro ao carregar geofences');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/geofences', {
                method: 'POST',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                    radius: parseFloat(radius),
                }),
            });

            if (res.ok) {
                setShowAddModal(false);
                setName('');
                setLat('');
                setLon('');
                fetchGeofences();
                showSuccess('Geofence criada com sucesso!');
            } else {
                showError('Erro ao criar geofence');
            }
        } catch (error) {
            console.error('Failed to create geofence', error);
            showError('Erro de conexão ao criar geofence');
        }
    };

    const handleToggleActive = async (geofence: Geofence) => {
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/geofences?id=${geofence.id}`, {
                method: 'PATCH',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !geofence.active }),
            });

            if (res.ok) {
                fetchGeofences();
                showSuccess(`Geofence ${!geofence.active ? 'ativada' : 'desativada'} com sucesso!`);
            } else {
                showError('Erro ao alterar status da geofence');
            }
        } catch (error) {
            console.error('Failed to toggle geofence', error);
            showError('Erro de conexão');
        }
    };

    const handleDelete = (geofence: Geofence) => {
        showConfirm(
            `Tem certeza que deseja excluir a geofence "${geofence.name}"?`,
            async () => {
                try {
                    const authHeaders = await getAuthHeaders();
                    const res = await fetch(`/api/geofences?id=${geofence.id}`, {
                        method: 'DELETE',
                        headers: authHeaders,
                    });

                    if (res.ok) {
                        fetchGeofences();
                        showSuccess('Geofence excluída com sucesso!');
                    } else {
                        showError('Erro ao excluir geofence');
                    }
                } catch (error) {
                    console.error('Failed to delete geofence', error);
                    showError('Erro de conexão ao excluir geofence');
                }
            },
            'Excluir Geofence'
        );
    };

    const openEditModal = (geofence: Geofence) => {
        setSelectedGeofenceForEdit(geofence);
        setEditName(geofence.name);
        setEditLat(geofence.latitude.toString());
        setEditLon(geofence.longitude.toString());
        setEditRadius(geofence.radius.toString());
        setShowEditModal(true);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGeofenceForEdit) return;

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/geofences?id=${selectedGeofenceForEdit.id}`, {
                method: 'PATCH',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editName,
                    latitude: parseFloat(editLat),
                    longitude: parseFloat(editLon),
                    radius: parseFloat(editRadius),
                }),
            });

            if (res.ok) {
                setShowEditModal(false);
                setSelectedGeofenceForEdit(null);
                fetchGeofences();
                showSuccess('Geofence atualizada com sucesso!');
            } else {
                showError('Erro ao atualizar geofence');
            }
        } catch (error) {
            console.error('Failed to update geofence', error);
            showError('Erro de conexão ao atualizar geofence');
        }
    };

    const getEditCurrentLocation = () => {
        if (!navigator.geolocation) {
            showError('Geolocalização não é suportada pelo seu navegador');
            return;
        }
        
        setGettingEditLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setEditLat(position.coords.latitude.toString());
                setEditLon(position.coords.longitude.toString());
                setGettingEditLocation(false);
                showSuccess('Localização obtida com sucesso!');
            },
            (error) => {
                setGettingEditLocation(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        showError('Permissão de localização negada.');
                        break;
                    default:
                        showError('Erro ao obter localização.');
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const getGeofenceQRUrl = (geofenceId: string) => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/ponto?geofenceId=${geofenceId}`;
        }
        return '';
    };

    const downloadQRCode = () => {
        if (!qrRef.current || !selectedGeofenceForQR) return;
        
        const svg = qrRef.current.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        // Export at 2000x2000 for high quality print
        const exportSize = 2000;

        img.onload = () => {
            canvas.width = exportSize;
            canvas.height = exportSize;
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, exportSize, exportSize);
                
                const pngFile = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.download = `qrcode-${selectedGeofenceForQR.name.replace(/\s+/g, '-').toLowerCase()}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            }
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            showError('Geolocalização não é suportada pelo seu navegador');
            return;
        }
        
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLat(position.coords.latitude.toString());
                setLon(position.coords.longitude.toString());
                setGettingLocation(false);
                showSuccess('Localização obtida com sucesso!');
            },
            (error) => {
                setGettingLocation(false);
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        showError('Permissão de localização negada. Habilite nas configurações do navegador.');
                        break;
                    case error.POSITION_UNAVAILABLE:
                        showError('Informação de localização indisponível.');
                        break;
                    case error.TIMEOUT:
                        showError('Tempo esgotado ao obter localização.');
                        break;
                    default:
                        showError('Erro desconhecido ao obter localização.');
                        break;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    return (
        <Layout title="Gerenciar Geofences">
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
                    <h1 className="text-2xl font-bold">Geofences</h1>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary"
                    >
                        <Plus size={20} />
                        Nova Geofence
                    </button>
                </div>

                {loading ? (
                    <p className="text-muted">Carregando...</p>
                ) : (
                    <div className="geofence-list">
                        {geofences.map((fence) => (
                            <div key={fence.id} className="glass-panel geofence-item" style={{ padding: '1.25rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                    {/* Info */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1', minWidth: '200px' }}>
                                        <MapPin size={24} className={fence.active ? 'text-success' : 'text-error'} />
                                        <div>
                                            <h3 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                                                {fence.name}
                                            </h3>
                                            <p className="text-xs text-muted">
                                                Lat: {fence.latitude.toFixed(6)}, Lon: {fence.longitude.toFixed(6)} | Raio: {fence.radius}m
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status e Toggle */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span className={`badge ${fence.active ? 'badge-success' : 'badge-error'}`}>
                                            {fence.active ? 'Ativo' : 'Inativo'}
                                        </span>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={fence.active}
                                                onChange={() => handleToggleActive(fence)}
                                            />
                                            <div className="slider">
                                                <div className="slider-btn">
                                                    <div className="light"></div>
                                                    <div className="texture"></div>
                                                    <div className="texture"></div>
                                                    <div className="texture"></div>
                                                    <div className="light"></div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Ações */}
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => openEditModal(fence)}
                                            className="btn btn-outline"
                                            title="Editar"
                                        >
                                            <Pencil size={18} />
                                        </button>
                                        <button
                                            onClick={() => setSelectedGeofenceForQR(fence)}
                                            className="btn btn-outline"
                                            title="QR Code"
                                            disabled={!fence.active}
                                        >
                                            <QrCode size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(fence)}
                                            className="btn btn-danger"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {geofences.length === 0 && (
                            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                                <MapPin size={48} className="text-muted" style={{ marginBottom: '1rem' }} />
                                <p className="text-muted">Nenhuma geofence cadastrada.</p>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="btn btn-primary mt-4"
                                >
                                    <Plus size={20} />
                                    Criar primeira geofence
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* QR Code Modal for Geofence */}
                {selectedGeofenceForQR && (
                    <div className="modal-overlay">
                        <div className="modal-content flex-center" style={{ flexDirection: 'column', textAlign: 'center', maxHeight: '95vh', overflow: 'hidden', padding: '1.5rem' }}>
                            <button
                                onClick={() => setSelectedGeofenceForQR(null)}
                                className="close-btn"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-xl font-bold mb-2">QR Code - Bater Ponto</h2>
                            <p className="text-sm text-muted mb-4">
                                Escaneie este QR Code para registrar ponto em <strong>{selectedGeofenceForQR.name}</strong>
                            </p>

                            <div ref={qrRef} style={{ background: 'white', padding: '1rem', borderRadius: '16px', marginBottom: '1rem' }}>
                                <QRCodeSVG
                                    value={getGeofenceQRUrl(selectedGeofenceForQR.id)}
                                    size={300}
                                    level="H"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '0.75rem' }}>
                                <button
                                    onClick={downloadQRCode}
                                    className="btn btn-primary"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Download size={18} />
                                    Baixar QR Code
                                </button>

                                <button
                                    onClick={() => window.open(getGeofenceQRUrl(selectedGeofenceForQR.id), '_blank')}
                                    className="btn btn-outline"
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <ExternalLink size={18} />
                                    Acessar via Link
                                </button>
                            </div>

                            <p className="text-xs text-muted" style={{ maxWidth: '320px' }}>
                                O funcionário deve escanear este código com o celular vinculado para bater o ponto.
                            </p>
                        </div>
                    </div>
                )}

                {showAddModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="close-btn"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-xl font-bold mb-6">Nova Geofence</h2>
                            <form onSubmit={handleCreate}>
                                <div className="input-group">
                                    <label className="label">Nome</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="input"
                                        placeholder="Ex: Escritório Principal"
                                        required
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label className="label">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={lat}
                                            onChange={(e) => setLat(e.target.value)}
                                            className="input"
                                            placeholder="-23.5505"
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={lon}
                                            onChange={(e) => setLon(e.target.value)}
                                            className="input"
                                            placeholder="-46.6333"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={getCurrentLocation}
                                    className="btn btn-outline mb-6"
                                    style={{ width: '100%', marginTop: '-0.5rem' }}
                                    disabled={gettingLocation}
                                >
                                    <MapPin size={16} />
                                    {gettingLocation ? 'Obtendo localização...' : 'Usar minha localização atual'}
                                </button>
                                <div className="input-group">
                                    <label className="label">Raio (metros)</label>
                                    <input
                                        type="number"
                                        value={radius}
                                        onChange={(e) => setRadius(e.target.value)}
                                        className="input"
                                        placeholder="100"
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-full">
                                    Criar Geofence
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Geofence Modal */}
                {showEditModal && selectedGeofenceForEdit && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedGeofenceForEdit(null);
                                }}
                                className="close-btn"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-xl font-bold mb-6">Editar Geofence</h2>
                            <form onSubmit={handleEdit}>
                                <div className="input-group">
                                    <label className="label">Nome</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="input"
                                        placeholder="Ex: Escritório Principal"
                                        required
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label className="label">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={editLat}
                                            onChange={(e) => setEditLat(e.target.value)}
                                            className="input"
                                            placeholder="-23.5505"
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="label">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={editLon}
                                            onChange={(e) => setEditLon(e.target.value)}
                                            className="input"
                                            placeholder="-46.6333"
                                            required
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={getEditCurrentLocation}
                                    className="btn btn-outline mb-6"
                                    style={{ width: '100%', marginTop: '-0.5rem' }}
                                    disabled={gettingEditLocation}
                                >
                                    <MapPin size={16} />
                                    {gettingEditLocation ? 'Obtendo localização...' : 'Usar minha localização atual'}
                                </button>
                                <div className="input-group">
                                    <label className="label">Raio (metros)</label>
                                    <input
                                        type="number"
                                        value={editRadius}
                                        onChange={(e) => setEditRadius(e.target.value)}
                                        className="input"
                                        placeholder="100"
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-full">
                                    Salvar Alterações
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
