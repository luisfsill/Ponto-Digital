import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { User, DeviceAuthorization } from '@/types';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, QrCode, X, ArrowLeft, Pencil, Trash2, Smartphone, AlertTriangle, Link2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/authHeaders';
import { useFeedback } from '@/context/FeedbackContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminUsers() {
    return (
        <ProtectedRoute>
            <AdminUsersContent />
        </ProtectedRoute>
    );
}

function AdminUsersContent() {
    const router = useRouter();
    const { showSuccess, showError, showConfirm } = useFeedback();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDevicesModal, setShowDevicesModal] = useState(false);
    const [selectedUserForQR, setSelectedUserForQR] = useState<User | null>(null);
    const [selectedUserForDevices, setSelectedUserForDevices] = useState<User | null>(null);
    const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
    
    // Estados de animação de fechamento
    const [closingAddModal, setClosingAddModal] = useState(false);
    const [closingEditModal, setClosingEditModal] = useState(false);
    const [closingDevicesModal, setClosingDevicesModal] = useState(false);
    const [closingQRModal, setClosingQRModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newWorksSaturday, setNewWorksSaturday] = useState(false);
    const [newPartTime, setNewPartTime] = useState(false);
    const [newWorkStartTime, setNewWorkStartTime] = useState('');
    const [newWorkEndTime, setNewWorkEndTime] = useState('');
    const [editName, setEditName] = useState('');
    const [editWorksSaturday, setEditWorksSaturday] = useState(false);
    const [editPartTime, setEditPartTime] = useState(false);
    const [editWorkStartTime, setEditWorkStartTime] = useState('');
    const [editWorkEndTime, setEditWorkEndTime] = useState('');
    const [editingDevice, setEditingDevice] = useState<{deviceId: string, name: string} | null>(null);

    // Funções de fechamento com animação
    const closeAddModal = useCallback(() => {
        setClosingAddModal(true);
        setTimeout(() => {
            setShowAddModal(false);
            setClosingAddModal(false);
            setNewName('');
            setNewWorksSaturday(false);
            setNewPartTime(false);
            setNewWorkStartTime('');
            setNewWorkEndTime('');
        }, 250);
    }, []);

    const closeEditModal = useCallback(() => {
        setClosingEditModal(true);
        setTimeout(() => {
            setShowEditModal(false);
            setClosingEditModal(false);
            setSelectedUserForEdit(null);
            setEditName('');
            setEditWorksSaturday(false);
            setEditPartTime(false);
            setEditWorkStartTime('');
            setEditWorkEndTime('');
        }, 250);
    }, []);

    const closeDevicesModal = useCallback(() => {
        setClosingDevicesModal(true);
        setTimeout(() => {
            setShowDevicesModal(false);
            setClosingDevicesModal(false);
            setSelectedUserForDevices(null);
        }, 250);
    }, []);

    const closeQRModal = useCallback(() => {
        setClosingQRModal(true);
        setTimeout(() => {
            setSelectedUserForQR(null);
            setClosingQRModal(false);
        }, 250);
    }, []);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await fetch('/api/users', { headers });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`API Error: ${res.status} ${res.statusText} - ${text.substring(0, 100)}`);
            }
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: newName, 
                    role: 'funcionario',
                    works_saturday: newWorksSaturday,
                    part_time: newPartTime,
                    work_start_time: newPartTime ? newWorkStartTime : null,
                    work_end_time: newPartTime ? newWorkEndTime : null
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowAddModal(false);
                setNewName('');
                setNewWorksSaturday(false);
                setNewPartTime(false);
                setNewWorkStartTime('');
                setNewWorkEndTime('');
                fetchUsers();
                showSuccess('Usuário criado com sucesso!');
            } else {
                console.error('API Error:', data);
                showError(`Erro ao criar usuário: ${data.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Failed to create user', error);
            showError('Erro de conexão ao criar usuário');
        }
    };

    const handleEditUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserForEdit) return;

        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/users?id=${selectedUserForEdit.id}`, {
                method: 'PUT',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: editName,
                    works_saturday: editWorksSaturday,
                    part_time: editPartTime,
                    work_start_time: editPartTime ? editWorkStartTime : null,
                    work_end_time: editPartTime ? editWorkEndTime : null
                }),
            });

            const data = await res.json();

            if (res.ok) {
                setShowEditModal(false);
                setSelectedUserForEdit(null);
                setEditName('');
                setEditWorksSaturday(false);
                setEditPartTime(false);
                setEditWorkStartTime('');
                setEditWorkEndTime('');
                fetchUsers();
                showSuccess('Usuário atualizado com sucesso!');
            } else {
                console.error('API Error:', data);
                showError(`Erro ao atualizar usuário: ${data.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Failed to update user', error);
            showError('Erro de conexão ao atualizar usuário');
        }
    };

    const handleDeleteUser = (userId: string, userName: string) => {
        showConfirm(
            `Tem certeza que deseja excluir o usuário "${userName}"?`,
            async () => {
                try {
                    const authHeaders = await getAuthHeaders();
                    const res = await fetch(`/api/users?id=${userId}`, {
                        method: 'DELETE',
                        headers: authHeaders,
                    });

                    if (res.ok) {
                        fetchUsers();
                        showSuccess('Usuário excluído com sucesso!');
                    } else {
                        const data = await res.json();
                        console.error('API Error:', data);
                        showError(`Erro ao excluir usuário: ${data.error || 'Erro desconhecido'}`);
                    }
                } catch (error) {
                    console.error('Failed to delete user', error);
                    showError('Erro de conexão ao excluir usuário');
                }
            },
            'Excluir Usuário'
        );
    };

    const handleRemoveDevice = async (userId: string, deviceId: string) => {
        if (!selectedUserForDevices) return;
        
        showConfirm(
            `Tem certeza que deseja remover este dispositivo?`,
            async () => {
                try {
                    const authHeaders = await getAuthHeaders();
                    const res = await fetch(`/api/users?id=${userId}&action=remove-device`, {
                        method: 'PATCH',
                        headers: { ...authHeaders, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ deviceId }),
                    });

                    if (res.ok) {
                        const updatedUser = await res.json();
                        setSelectedUserForDevices(updatedUser);
                        fetchUsers();
                        showSuccess('Dispositivo removido com sucesso!');
                    } else {
                        const data = await res.json();
                        showError(`Erro ao remover dispositivo: ${data.error || 'Erro desconhecido'}`);
                    }
                } catch (error) {
                    console.error('Failed to remove device', error);
                    showError('Erro de conexão ao remover dispositivo');
                }
            },
            'Remover Dispositivo'
        );
    };

    const handleRenameDevice = async (userId: string, deviceId: string, newDeviceName: string) => {
        try {
            const authHeaders = await getAuthHeaders();
            const res = await fetch(`/api/users?id=${userId}&action=rename-device`, {
                method: 'PATCH',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId, deviceName: newDeviceName }),
            });

            if (res.ok) {
                const updatedUser = await res.json();
                setSelectedUserForDevices(updatedUser);
                fetchUsers();
                setEditingDevice(null);
                showSuccess('Dispositivo renomeado com sucesso!');
            } else {
                const data = await res.json();
                showError(`Erro ao renomear dispositivo: ${data.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Failed to rename device', error);
            showError('Erro de conexão ao renomear dispositivo');
        }
    };

    const openDevicesModal = async (user: User) => {
        setSelectedUserForDevices(user);
        setShowDevicesModal(true);
        setEditingDevice(null);
        
        // Buscar dispositivos atualizados
        try {
            const headers = await getAuthHeaders();
            const res = await fetch(`/api/users?id=${user.id}`, { headers });
            if (res.ok) {
                const updatedUser = await res.json();
                setSelectedUserForDevices(updatedUser);
                // Atualizar também a contagem na lista principal
                setUsers(prevUsers => prevUsers.map(u => 
                    u.id === updatedUser.id ? updatedUser : u
                ));
            }
        } catch (error) {
            console.error('Failed to fetch user devices', error);
        }
    };

    const openEditModal = (user: User) => {
        setSelectedUserForEdit(user);
        setEditName(user.name);
        setEditWorksSaturday(user.works_saturday || false);
        setEditPartTime(user.part_time || false);
        setEditWorkStartTime(user.work_start_time || '');
        setEditWorkEndTime(user.work_end_time || '');
        setShowEditModal(true);
    };

    const getBindingUrl = (userId: string) => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/vincular-device?userId=${userId}`;
        }
        return '';
    };

    return (
        <Layout title="Gerenciar Usuários">
            <div className="mb-8">
                <button
                    onClick={() => router.push('/admin')}
                    className="btn btn-primary mb-4"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    <ArrowLeft size={18} />
                    Voltar
                </button>

                <div className="flex-between mb-8">
                    <h1 className="text-2xl font-bold">Usuários</h1>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn btn-primary"
                    >
                        <Plus size={20} />
                        Novo Usuário
                    </button>
                </div>

                {loading ? (
                    <p className="text-muted">Carregando...</p>
                ) : (
                    <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr' }}>
                        {users.map((user) => (
                            <div key={user.id} className="glass-panel user-card-mobile" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="user-info">
                                    <h3 className="card-title">{user.name}</h3>
                                    <p className="text-xs text-muted mt-1">
                                        Dispositivos vinculados: {user.devices?.length || 0}
                                    </p>
                                </div>
                                <div className="user-actions" style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => openEditModal(user)}
                                        className="btn btn-outline btn-edit"
                                        title="Editar"
                                    >
                                        <Pencil size={18} className="icon-edit" />
                                    </button>
                                    <button
                                        onClick={() => openDevicesModal(user)}
                                        className="btn btn-outline"
                                        style={{ color: 'var(--secondary)', borderColor: 'var(--secondary)' }}
                                        title="Ver Dispositivos"
                                    >
                                        <Smartphone size={18} />
                                    </button>
                                    <button
                                        onClick={() => setSelectedUserForQR(user)}
                                        className="btn btn-outline"
                                        title="Vincular Dispositivo"
                                    >
                                        <QrCode size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteUser(user.id, user.name)}
                                        className="btn btn-danger"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add User Modal */}
                {showAddModal && (
                    <div className={`modal-overlay ${closingAddModal ? 'closing' : ''}`}>
                        <div className={`modal-content ${closingAddModal ? 'closing' : ''}`}>
                            <button
                                onClick={closeAddModal}
                                className="close-btn"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-xl font-bold mb-6">Novo Usuário</h2>
                            <form onSubmit={handleCreateUser}>
                                <div className="input-group">
                                    <label className="label">Nome</label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="input"
                                        required
                                        placeholder="Nome do usuário"
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="checkbox-wrapper">
                                        <input 
                                            type="checkbox" 
                                            checked={newWorksSaturday}
                                            onChange={(e) => setNewWorksSaturday(e.target.checked)}
                                        />
                                        <span className="checkmark">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </span>
                                        <span className="checkbox-label">Trabalha aos sábados</span>
                                    </label>
                                </div>

                                <div className="input-group">
                                    <label className="checkbox-wrapper">
                                        <input 
                                            type="checkbox" 
                                            checked={newPartTime}
                                            onChange={(e) => setNewPartTime(e.target.checked)}
                                        />
                                        <span className="checkmark">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </span>
                                        <span className="checkbox-label">Trabalha meio período</span>
                                    </label>
                                </div>

                                {newPartTime && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label className="label">Início</label>
                                            <input
                                                type="time"
                                                value={newWorkStartTime}
                                                onChange={(e) => setNewWorkStartTime(e.target.value)}
                                                className="input"
                                                required
                                            />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label className="label">Fim</label>
                                            <input
                                                type="time"
                                                value={newWorkEndTime}
                                                onChange={(e) => setNewWorkEndTime(e.target.value)}
                                                className="input"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary w-full">
                                    Criar
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit User Modal */}
                {showEditModal && selectedUserForEdit && (
                    <div className={`modal-overlay ${closingEditModal ? 'closing' : ''}`}>
                        <div className={`modal-content ${closingEditModal ? 'closing' : ''}`}>
                            <button
                                onClick={closeEditModal}
                                className="close-btn"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-xl font-bold mb-6">Editar Usuário</h2>
                            <form onSubmit={handleEditUser}>
                                <div className="input-group">
                                    <label className="label">Nome</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="input"
                                        required
                                        placeholder="Nome do usuário"
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="checkbox-wrapper">
                                        <input 
                                            type="checkbox" 
                                            checked={editWorksSaturday}
                                            onChange={(e) => setEditWorksSaturday(e.target.checked)}
                                        />
                                        <span className="checkmark">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </span>
                                        <span className="checkbox-label">Trabalha aos sábados</span>
                                    </label>
                                </div>

                                <div className="input-group">
                                    <label className="checkbox-wrapper">
                                        <input 
                                            type="checkbox" 
                                            checked={editPartTime}
                                            onChange={(e) => setEditPartTime(e.target.checked)}
                                        />
                                        <span className="checkmark">
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </span>
                                        <span className="checkbox-label">Trabalha meio período</span>
                                    </label>
                                </div>

                                {editPartTime && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label className="label">Início</label>
                                            <input
                                                type="time"
                                                value={editWorkStartTime}
                                                onChange={(e) => setEditWorkStartTime(e.target.value)}
                                                className="input"
                                                required
                                            />
                                        </div>
                                        <div className="input-group" style={{ marginBottom: 0 }}>
                                            <label className="label">Fim</label>
                                            <input
                                                type="time"
                                                value={editWorkEndTime}
                                                onChange={(e) => setEditWorkEndTime(e.target.value)}
                                                className="input"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary w-full">
                                    Salvar
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Devices Modal */}
                {showDevicesModal && selectedUserForDevices && (
                    <div className={`modal-overlay ${closingDevicesModal ? 'closing' : ''}`}>
                        <div className={`modal-content ${closingDevicesModal ? 'closing' : ''}`}>
                            <button
                                onClick={closeDevicesModal}
                                className="close-btn"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-xl font-bold mb-2">Dispositivos Vinculados</h2>
                            <p className="text-sm text-muted mb-6">
                                Dispositivos de <strong>{selectedUserForDevices.name}</strong>
                            </p>

                            {selectedUserForDevices.devices && selectedUserForDevices.devices.length > 0 ? (
                                <div className="item-list">
                                    {selectedUserForDevices.devices.map((device, index) => (
                                        <div key={device.id} className="item-card">
                                            <div className="item-info">
                                                <div className="item-icon">
                                                    <Smartphone size={22} className="text-secondary" />
                                                </div>
                                                <div className="item-details">
                                                    {editingDevice?.deviceId === device.device_id ? (
                                                        <form
                                                            onSubmit={(e) => {
                                                                e.preventDefault();
                                                                handleRenameDevice(selectedUserForDevices.id, device.device_id, editingDevice.name);
                                                            }}
                                                            className="device-edit-form"
                                                            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}
                                                        >
                                                            <input
                                                                type="text"
                                                                value={editingDevice.name}
                                                                onChange={(e) => setEditingDevice({ ...editingDevice, name: e.target.value })}
                                                                className="input"
                                                                style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem', flex: '1', minWidth: '150px' }}
                                                                autoFocus
                                                            />
                                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 0.75rem' }}>
                                                                    Salvar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingDevice(null)}
                                                                    className="btn btn-outline"
                                                                    style={{ padding: '0.5rem 0.75rem' }}
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <p className="font-bold text-sm">
                                                            {device.device_name || `Dispositivo ${index + 1}`}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>
                                                        {device.device_id.substring(0, 20)}...
                                                    </p>
                                                    <p className="text-xs text-muted mt-1">
                                                        Vinculado em: {format(new Date(device.authorized_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="item-actions">
                                                {editingDevice?.deviceId !== device.device_id && (
                                                    <button
                                                        onClick={() => setEditingDevice({ deviceId: device.device_id, name: device.device_name || `Dispositivo ${index + 1}` })}
                                                        className="btn btn-outline btn-icon"
                                                        title="Renomear Dispositivo"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveDevice(selectedUserForDevices.id, device.device_id)}
                                                    className="btn btn-danger btn-icon"
                                                    title="Remover Dispositivo"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <Smartphone size={48} className="empty-state-icon" />
                                    <p className="empty-state-title">Nenhum dispositivo vinculado</p>
                                    <p className="empty-state-text">
                                        Use o QR Code para vincular um dispositivo.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* QR Code Modal */}
                {selectedUserForQR && (
                    <div className={`modal-overlay ${closingQRModal ? 'closing' : ''}`}>
                        <div className={`modal-content flex-center ${closingQRModal ? 'closing' : ''}`} style={{ flexDirection: 'column', textAlign: 'center', maxWidth: '700px' }}>
                            <button
                                onClick={closeQRModal}
                                className="close-btn"
                            >
                                <X size={24} />
                            </button>
                            <h2 className="text-xl font-bold mb-2">Vincular Dispositivo</h2>
                            <p className="text-sm text-muted mb-6">
                                Peça para <strong>{selectedUserForQR.name}</strong> escanear este QR Code com o celular.
                            </p>

                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
                                <QRCodeSVG
                                    value={getBindingUrl(selectedUserForQR.id)}
                                    size={600}
                                    level="H"
                                />
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    window.open(getBindingUrl(selectedUserForQR.id), '_blank');
                                }}
                                style={{ marginBottom: '1rem' }}
                            >
                                <Link2 size={16} />
                                Via Link
                            </button>

                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
