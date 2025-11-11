




import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student, PracticeGroup, Service, ServiceEvaluation, ServiceRole, StudentRoleAssignment, Elaboration } from '../types';
import { PlusIcon, TrashIcon, SettingsIcon, PencilIcon, SaveIcon, InfoIcon, CalendarDaysIcon, ChefHatIcon, XIcon } from '../components/icons';

interface GestionPracticaProps {
    students: Student[];
    practiceGroups: PracticeGroup[];
    services: Service[];
    serviceEvaluations: ServiceEvaluation[];
    serviceRoles: ServiceRole[];
    setServiceRoles: React.Dispatch<React.SetStateAction<ServiceRole[]>>;
    onSave: (service: Service, evaluation: ServiceEvaluation) => void;
    onDelete: (serviceId: string) => void;
    onDeleteRole: (roleId: string) => void;
    initialServiceId: string | null;
    clearInitialServiceId: () => void;
}

const GestionPractica: React.FC<GestionPracticaProps> = ({
    students,
    practiceGroups,
    services,
    serviceEvaluations,
    serviceRoles,
    setServiceRoles,
    onSave,
    onDelete,
    onDeleteRole,
    initialServiceId,
    clearInitialServiceId,
}) => {
    const [selectedServiceId, setSelectedServiceId] = useState<string | null>(initialServiceId);
    const [editedService, setEditedService] = useState<Service | null>(null);
    const [editedEvaluation, setEditedEvaluation] = useState<ServiceEvaluation | null>(null);
    const [activeTab, setActiveTab] = useState('distribucion');

    useEffect(() => {
        if (initialServiceId) {
            setSelectedServiceId(initialServiceId);
            clearInitialServiceId();
        }
    }, [initialServiceId, clearInitialServiceId]);

    useEffect(() => {
        if (selectedServiceId) {
            const service = services.find(s => s.id === selectedServiceId);
            const evaluation = serviceEvaluations.find(e => e.serviceId === selectedServiceId);
            setEditedService(service ? JSON.parse(JSON.stringify(service)) : null);
            setEditedEvaluation(evaluation ? JSON.parse(JSON.stringify(evaluation)) : null);
            setActiveTab('distribucion'); // Reset tab on service change
        } else {
            setEditedService(null);
            setEditedEvaluation(null);
        }
    }, [selectedServiceId, services, serviceEvaluations]);
    
    const handleCreateService = () => {
        const newServiceId = `service-${Date.now()}`;
        // FIX: Added the 'isLocked' property, which is required by the 'Service' type.
        const newService: Service = {
            id: newServiceId,
            name: `Nuevo Servicio ${new Date().toLocaleDateString('es-ES')}`,
            date: new Date().toISOString().split('T')[0],
            // FIX: Add required 'trimester' property. Defaulting to 't1'.
            trimester: 't1',
            isLocked: false,
            assignedGroups: { comedor: [], takeaway: [] },
            elaborations: { comedor: [], takeaway: [] },
            studentRoles: [],
        };
        const newEvaluation: ServiceEvaluation = {
            id: `eval-${newServiceId}`,
            serviceId: newServiceId,
            // FIX: The 'preService' property is a map of dates to evaluations, so it should be initialized as an empty object.
            preService: {},
            serviceDay: { groupScores: {}, individualScores: {} },
        };
        onSave(newService, newEvaluation);
        setSelectedServiceId(newServiceId);
    };

    const handleDeleteService = () => {
        if (editedService && window.confirm(`¿Estás seguro de que quieres eliminar el servicio "${editedService.name}" y todas sus evaluaciones?`)) {
            onDelete(editedService.id);
            setSelectedServiceId(null);
        }
    };
    
    const handleSave = () => {
        if (editedService && editedEvaluation) {
            onSave(editedService, editedEvaluation);
            alert('Servicio guardado con éxito.');
        }
    };
    
    const handleServiceFieldChange = (field: keyof Service, value: any) => {
        if (editedService) {
            setEditedService(prev => prev ? { ...prev, [field]: value } : null);
        }
    };
    
    const toggleGroupAssignment = (area: 'comedor' | 'takeaway', groupId: string) => {
        if (!editedService) return;
        
        const currentAssignments = editedService.assignedGroups[area];
        const newAssignments = currentAssignments.includes(groupId)
            ? currentAssignments.filter(id => id !== groupId)
            : [...currentAssignments, groupId];
            
        setEditedService({
            ...editedService,
            assignedGroups: {
                ...editedService.assignedGroups,
                [area]: newAssignments,
            }
        });
    };

    const studentsInService = useMemo(() => {
        if (!editedService) return [];
        const assignedGroupIds = [
            ...editedService.assignedGroups.comedor,
            ...editedService.assignedGroups.takeaway,
        ];
        const assignedGroups = practiceGroups.filter(g => assignedGroupIds.includes(g.id));
        const studentIdsInService = new Set(assignedGroups.flatMap(g => g.studentIds));
        return students.filter(s => studentIdsInService.has(s.id))
                       .sort((a,b) => a.apellido1.localeCompare(b.apellido1));
    }, [editedService, practiceGroups, students]);
    
    const handleStudentRoleChange = (studentId: string, roleId: string | null) => {
        if (!editedService) return;

        const existingAssignmentIndex = editedService.studentRoles.findIndex(sr => sr.studentId === studentId);
        const newStudentRoles = [...editedService.studentRoles];

        if (roleId === null || roleId === '') {
            if (existingAssignmentIndex > -1) {
                newStudentRoles.splice(existingAssignmentIndex, 1);
            }
        } else {
             if (existingAssignmentIndex > -1) {
                newStudentRoles[existingAssignmentIndex] = { studentId, roleId };
            } else {
                newStudentRoles.push({ studentId, roleId });
            }
        }
        handleServiceFieldChange('studentRoles', newStudentRoles);
    };

    const sortedServices = useMemo(() =>
        [...services].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        [services]
    );

    if (practiceGroups.length === 0) {
        return (
            <div className="text-center p-8 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-bold text-gray-700">Primero define los grupos de práctica</h2>
                <p className="text-gray-500 mt-2">No puedes gestionar servicios sin haber creado grupos de alumnos primero.</p>
            </div>
        );
    }
    
    const renderWorkspace = () => {
        if (!editedService) {
             return (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <ChefHatIcon className="mx-auto h-16 w-16 text-gray-300" />
                        <h2 className="mt-4 text-xl font-semibold text-gray-700">Selecciona un servicio o crea uno nuevo</h2>
                        <p className="mt-1 text-gray-500">Aquí podrás distribuir grupos, asignar puestos y evaluar.</p>
                    </div>
                </div>
            );
        }

        return (
            <div>
                 <header className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-4 border-b">
                    <div>
                        <input
                            type="text"
                            value={editedService.name}
                            onChange={(e) => handleServiceFieldChange('name', e.target.value)}
                            className="text-3xl font-bold text-gray-800 bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-md p-1 -ml-1"
                        />
                         <input
                            type="date"
                            value={editedService.date}
                            onChange={(e) => handleServiceFieldChange('date', e.target.value)}
                            className="text-gray-500 mt-1 block bg-transparent focus:bg-white focus:ring-1 focus:ring-blue-500 rounded-md"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleSave} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition">
                            <SaveIcon className="w-5 h-5 mr-1" /> Guardar
                        </button>
                         <button onClick={handleDeleteService} className="flex items-center bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex space-x-2">
                         <button onClick={() => setActiveTab('distribucion')} className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${activeTab === 'distribucion' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>Distribución de Grupos</button>
                         <button onClick={() => setActiveTab('puestos')} className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${activeTab === 'puestos' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>Asignar Puestos</button>
                    </nav>
                </div>

                {activeTab === 'distribucion' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(['comedor', 'takeaway'] as const).map(area => (
                            <div key={area} className="bg-white p-4 rounded-lg shadow-sm">
                                <h3 className="text-lg font-bold mb-3 capitalize text-gray-700">{area}</h3>
                                <div className="space-y-2">
                                    {practiceGroups.map(group => (
                                        <label key={group.id} className="flex items-center p-3 rounded-md hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={editedService.assignedGroups[area].includes(group.id)}
                                                onChange={() => toggleGroupAssignment(area, group.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="ml-3 text-sm font-medium text-gray-800">{group.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'puestos' && (
                     <div className="bg-white p-4 rounded-lg shadow-sm">
                         <h3 className="text-lg font-bold mb-3 text-gray-700">Puestos de Alumnos en Servicio</h3>
                         <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Alumno</th>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-600">Puesto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsInService.map(student => {
                                        const assignment = editedService.studentRoles.find(sr => sr.studentId === student.id);
                                        const role = assignment ? serviceRoles.find(r => r.id === assignment.roleId) : null;
                                        return (
                                            <tr key={student.id} className="border-b hover:bg-gray-50">
                                                <td className="px-4 py-2 font-medium text-gray-800">{`${student.apellido1} ${student.apellido2}, ${student.nombre}`}</td>
                                                <td className="px-4 py-2">
                                                    <select
                                                        value={assignment?.roleId || ''}
                                                        onChange={e => handleStudentRoleChange(student.id, e.target.value || null)}
                                                        className="w-full p-1.5 border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                    >
                                                        <option value="">Sin asignar</option>
                                                        {serviceRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                         </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex h-[calc(100vh-64px)]">
            <aside className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 bg-white p-4 border-r overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Servicios</h2>
                    <button onClick={handleCreateService} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-transform transform hover:scale-110">
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>
                <ul className="space-y-2">
                    {sortedServices.map(service => (
                        <li key={service.id}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); setSelectedServiceId(service.id); }}
                                className={`block p-3 rounded-lg transition-colors ${selectedServiceId === service.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                            >
                                <p className={`font-semibold ${selectedServiceId === service.id ? 'text-blue-800' : 'text-gray-800'}`}>{service.name}</p>
                                <p className="text-sm text-gray-500">{new Date(service.date).toLocaleDateString('es-ES')}</p>
                            </a>
                        </li>
                    ))}
                </ul>
            </aside>
            <main className="flex-1 p-4 sm:p-6 bg-gray-50 overflow-y-auto">
                {renderWorkspace()}
            </main>
        </div>
    );
};

export default GestionPractica;
