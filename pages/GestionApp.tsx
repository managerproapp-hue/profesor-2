

import React, { useState, useMemo, useRef, useCallback } from 'react';
// FIX: Corrected import path for TeacherData and InstituteData.
import { ServiceRole, TeacherData, InstituteData } from '../types';
import { SettingsIcon, SaveIcon, PlusIcon, TrashIcon, PencilIcon, UploadIcon, ExportIcon, XIcon } from '../components/icons';

interface GestionAppProps {
    teacherData: TeacherData;
    setTeacherData: React.Dispatch<React.SetStateAction<TeacherData>>;
    instituteData: InstituteData;
    setInstituteData: React.Dispatch<React.SetStateAction<InstituteData>>;
    serviceRoles: ServiceRole[];
    setServiceRoles: React.Dispatch<React.SetStateAction<ServiceRole[]>>;
    onDeleteRole: (roleId: string) => void;
}

const DataCard: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm">{children}</div>
);

const RoleModal: React.FC<{
    role: ServiceRole | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (role: ServiceRole) => void;
}> = ({ role, isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#cccccc');

    React.useEffect(() => {
        if (role) {
            setName(role.name);
            setColor(role.color);
        }
    }, [role]);

    if (!isOpen || !role) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...role, name, color });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{role.id.startsWith('new-') ? 'Añadir Nuevo Rol' : 'Editar Rol'}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XIcon className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="roleName" className="block text-sm font-medium text-gray-700">Nombre del Rol</label>
                        <input type="text" id="roleName" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="roleColor" className="block text-sm font-medium text-gray-700">Color</label>
                        <input type="color" id="roleColor" value={color} onChange={e => setColor(e.target.value)} className="mt-1 block w-full h-10" />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const GestionApp: React.FC<GestionAppProps> = ({ teacherData, setTeacherData, instituteData, setInstituteData, serviceRoles, setServiceRoles, onDeleteRole }) => {
    
    const [currentTeacherData, setCurrentTeacherData] = useState(teacherData);
    const [currentInstituteData, setCurrentInstituteData] = useState(instituteData);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<ServiceRole | null>(null);
    const [backupKeys, setBackupKeys] = useState<string[]>([]);
    
    const backupOptions = [
        'students', 'practiceGroups', 'services', 'serviceEvaluations', 'serviceRoles', 'entryExitRecords', 'principalGrades', 'otherGrades', 'practicalExamEvaluations', 'teacher-app-data', 'institute-app-data'
    ];

    const handleLogoChange = (setter: React.Dispatch<React.SetStateAction<any>>, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setter((prev: any) => ({ ...prev, [field]: event.target?.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleOpenRoleModal = (role: ServiceRole | null, type?: 'leader' | 'secondary') => {
        if (role) {
            setEditingRole(role);
        } else if(type) {
            setEditingRole({
                id: `new-role-${Date.now()}`,
                name: 'Nuevo Rol',
                color: '#808080',
                type,
            });
        }
        setIsRoleModalOpen(true);
    };

    const handleSaveRole = (role: ServiceRole) => {
        if (role.id.startsWith('new-')) {
             setServiceRoles(prev => [...prev, role]);
        } else {
             setServiceRoles(prev => prev.map(r => r.id === role.id ? role : r));
        }
    };
    
    const handleDeleteRoleInternal = (roleId: string, roleName: string) => {
        if(window.confirm(`¿Estás seguro que quieres eliminar el rol "${roleName}"? Esta acción no se puede deshacer.`)) {
            onDeleteRole(roleId);
        }
    }
    
    const leaderRoles = useMemo(() => serviceRoles.filter(r => r.type === 'leader'), [serviceRoles]);
    const secondaryRoles = useMemo(() => serviceRoles.filter(r => r.type === 'secondary'), [serviceRoles]);

    const handleBackup = () => {
        if (backupKeys.length === 0) {
            alert('Por favor, selecciona al menos un módulo de datos para respaldar.');
            return;
        }
        const backupData: Record<string, any> = {};
        backupKeys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                backupData[key] = JSON.parse(data);
            }
        });

        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `backup-culinary-app-${date}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
    
    const restoreFileInputRef = useRef<HTMLInputElement>(null);

    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.confirm('¡Atención! Restaurar una copia de seguridad sobrescribirá TODOS los datos actuales. ¿Deseas continuar?')) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const backupData = JSON.parse(event.target?.result as string);
                Object.keys(backupData).forEach(key => {
                    localStorage.setItem(key, JSON.stringify(backupData[key]));
                });
                alert('Restauración completada con éxito. La aplicación se recargará.');
                window.location.reload();
            } catch (error) {
                alert('Error al leer el archivo de copia de seguridad. Asegúrate de que el archivo es válido.');
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    const toggleBackupKey = (key: string) => {
        setBackupKeys(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    }

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <SettingsIcon className="w-8 h-8 mr-3 text-blue-500" />
                    Gestión de la App
                </h1>
                <p className="text-gray-500 mt-1">Personaliza la información, gestiona roles y realiza copias de seguridad.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                    <DataCard title="Datos del Profesor">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Datos del Profesor</h3>
                        <div className="flex items-center space-x-4 mb-4">
                             <img src={currentTeacherData.logo || 'https://via.placeholder.com/80'} alt="Logo Profesor" className="w-20 h-20 rounded-full object-cover bg-gray-200" />
                            <input type="file" accept="image/*" onChange={handleLogoChange(setCurrentTeacherData, 'logo')} className="text-sm" />
                        </div>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nombre y Apellidos" value={currentTeacherData.name} onChange={e => setCurrentTeacherData(p => ({...p, name: e.target.value}))} className="w-full p-2 border rounded" />
                            <input type="email" placeholder="Email" value={currentTeacherData.email} onChange={e => setCurrentTeacherData(p => ({...p, email: e.target.value}))} className="w-full p-2 border rounded" />
                            <button onClick={() => setTeacherData(currentTeacherData)} className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"><SaveIcon className="w-5 h-5 mr-2" />Guardar Datos</button>
                        </div>
                    </DataCard>

                    <DataCard title="Datos del Instituto">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Datos del Instituto</h3>
                        <div className="flex items-center space-x-4 mb-4">
                             <img src={currentInstituteData.logo || 'https://via.placeholder.com/80'} alt="Logo Instituto" className="w-20 h-20 rounded-md object-cover bg-gray-200" />
                            <input type="file" accept="image/*" onChange={handleLogoChange(setCurrentInstituteData, 'logo')} className="text-sm" />
                        </div>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nombre del Centro" value={currentInstituteData.name} onChange={e => setCurrentInstituteData(p => ({...p, name: e.target.value}))} className="w-full p-2 border rounded" />
                            <input type="text" placeholder="Dirección" value={currentInstituteData.address} onChange={e => setCurrentInstituteData(p => ({...p, address: e.target.value}))} className="w-full p-2 border rounded" />
                            <input type="text" placeholder="CIF" value={currentInstituteData.cif} onChange={e => setCurrentInstituteData(p => ({...p, cif: e.target.value}))} className="w-full p-2 border rounded" />
                            <button onClick={() => setInstituteData(currentInstituteData)} className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"><SaveIcon className="w-5 h-5 mr-2" />Guardar Datos</button>
                        </div>
                    </DataCard>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    <DataCard title="Roles de Servicio">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold">Líderes del Servicio</h4>
                                    <button onClick={() => handleOpenRoleModal(null, 'leader')} className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded hover:bg-blue-200">Añadir</button>
                                </div>
                                <div className="space-y-2">
                                    {leaderRoles.map(role => (
                                        <div key={role.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                            <div className="flex items-center cursor-pointer" onClick={() => handleOpenRoleModal(role)}>
                                                <div className="w-5 h-5 rounded-sm mr-2" style={{ backgroundColor: role.color }}></div>
                                                <span className="text-sm">{role.name}</span>
                                            </div>
                                            <div>
                                                <button onClick={() => handleDeleteRoleInternal(role.id, role.name)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold">Roles Secundarios</h4>
                                    <button onClick={() => handleOpenRoleModal(null, 'secondary')} className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded hover:bg-blue-200">Añadir</button>
                                </div>
                                <div className="space-y-2">
                                     {secondaryRoles.map(role => (
                                        <div key={role.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                            <div className="flex items-center cursor-pointer" onClick={() => handleOpenRoleModal(role)}>
                                                <div className="w-5 h-5 rounded-sm mr-2" style={{ backgroundColor: role.color }}></div>
                                                <span className="text-sm">{role.name}</span>
                                            </div>
                                            <div>
                                                <button onClick={() => handleDeleteRoleInternal(role.id, role.name)} className="p-1 text-gray-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </DataCard>

                    <DataCard title="Backup y Restauración">
                         <h3 className="text-xl font-bold text-gray-800 mb-4">Backup y Restauración</h3>
                         <div className="space-y-6">
                            <div>
                                <h4 className="font-bold mb-2">Crear Copia de Seguridad</h4>
                                <p className="text-sm text-gray-600 mb-3">Selecciona los módulos de datos para incluir en la copia de seguridad.</p>
                                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                    {backupOptions.map(key => (
                                        <label key={key} className="flex items-center">
                                            <input type="checkbox" checked={backupKeys.includes(key)} onChange={() => toggleBackupKey(key)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                                            <span className="ml-2">{key}</span>
                                        </label>
                                    ))}
                                </div>
                                <button onClick={handleBackup} className="w-full flex items-center justify-center bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition"><ExportIcon className="w-5 h-5 mr-2" />Crear y Descargar Copia</button>
                            </div>
                            <div className="border-t pt-4">
                                <h4 className="font-bold mb-2">Restaurar Copia de Seguridad</h4>
                                <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md mb-3"><strong>¡Atención!</strong> Esto reemplazará todos los datos actuales de la aplicación.</p>
                                <input type="file" accept=".json" onChange={handleRestore} ref={restoreFileInputRef} className="hidden" />
                                <button onClick={() => restoreFileInputRef.current?.click()} className="w-full flex items-center justify-center bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-gray-700 transition"><UploadIcon className="w-5 h-5 mr-2" />Seleccionar Archivo y Restaurar</button>
                            </div>
                         </div>
                    </DataCard>
                </div>
            </div>
            <RoleModal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} role={editingRole} onSave={handleSaveRole} />
        </div>
    );
};

export default GestionApp;