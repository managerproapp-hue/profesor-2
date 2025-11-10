

import React, { useState, useMemo, useEffect } from 'react';
import { Student, PracticeGroup } from '../types';
import { 
    PlusIcon,
    ExportIcon,
    TrashIcon,
    SearchIcon,
    SaveIcon
} from '../components/icons';

interface DefinirGruposProps { 
    students: Student[];
    practiceGroups: PracticeGroup[];
    setPracticeGroups: React.Dispatch<React.SetStateAction<PracticeGroup[]>>;
}

const groupColors = [
  'bg-red-200 border-red-300', 'bg-blue-200 border-blue-300', 
  'bg-green-200 border-green-300', 'bg-yellow-200 border-yellow-300',
  'bg-indigo-200 border-indigo-300', 'bg-pink-200 border-pink-300', 'bg-purple-200 border-purple-300'
];

const DefinirGrupos: React.FC<DefinirGruposProps> = ({ students, practiceGroups, setPracticeGroups }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const studentAssignments = useMemo(() => {
        const assignments: Record<string, string | null> = {};
        students.forEach(s => assignments[s.id] = null);
        practiceGroups.forEach(g => {
            g.studentIds.forEach(studentId => {
                assignments[studentId] = g.id;
            });
        });
        return assignments;
    }, [practiceGroups, students]);

    const handleAddGroup = () => {
        const nextGroupId = (practiceGroups.length > 0 ? Math.max(...practiceGroups.map(g => parseInt(g.id, 10))) : 0) + 1;
        const newGroup: PracticeGroup = {
            id: String(nextGroupId),
            name: `Grupo ${nextGroupId}`,
            color: groupColors[(nextGroupId - 1) % groupColors.length],
            studentIds: [],
        };
        setPracticeGroups(prev => [...prev, newGroup]);
    };

    const handleDeleteGroup = (groupId: string) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este grupo? Los alumnos asignados quedarán sin grupo.')) {
            setPracticeGroups(prev => prev.filter(g => g.id !== groupId));
        }
    };

    const handleAssignStudent = (studentId: string, groupId: string | null) => {
        setPracticeGroups(prev => {
            const newGroups = prev.map(g => ({
                ...g,
                studentIds: g.studentIds.filter(id => id !== studentId)
            }));
            if (groupId) {
                const targetGroup = newGroups.find(g => g.id === groupId);
                if (targetGroup) {
                    targetGroup.studentIds.push(studentId);
                }
            }
            return newGroups;
        });
    };

    const handleSaveGroups = () => {
        // Data is already saved in real-time via setPracticeGroups and useEffect in App.tsx
        // This button just provides user feedback.
        alert('La composición de los grupos ha sido guardada.');
    };
    
    const filteredStudents = useMemo(() => {
        return students.sort((a,b) => a.apellido1.localeCompare(b.apellido1)).filter(student => {
            const fullName = `${student.nombre} ${student.apellido1} ${student.apellido2}`.toLowerCase();
            return fullName.includes(searchTerm.toLowerCase());
        });
    }, [students, searchTerm]);

    const studentsWithoutGroup = useMemo(() => {
        return students.filter(s => !studentAssignments[s.id]).map(s => `${s.apellido1} ${s.apellido2}, ${s.nombre}`);
    }, [students, studentAssignments]);

    return (
        <div>
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Definir Grupos de Práctica</h1>
                <div className="flex space-x-3">
                    <button onClick={handleAddGroup} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                        <PlusIcon className="w-5 h-5 mr-1" />
                        Añadir Grupo
                    </button>
                    <button onClick={handleSaveGroups} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition">
                        <SaveIcon className="w-5 h-5 mr-1" />
                        Guardar Grupos
                    </button>
                    <button className="flex items-center bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition">
                        <ExportIcon className="w-5 h-5 mr-1" />
                        Exportar
                    </button>
                </div>
            </header>

            <main className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Listado de Alumnos</h2>
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                           <SearchIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                            placeholder="Buscar alumno..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                        {filteredStudents.map((student, index) => (
                            <li key={student.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-500 w-8">{index + 1}.</span>
                                    <img src={student.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover mr-3" />
                                    <div>
                                        <p className="font-semibold text-gray-800">{`${student.apellido1} ${student.apellido2}, ${student.nombre}`}</p>
                                        <p className="text-xs text-gray-500">{student.grupo}</p>
                                    </div>
                                </div>
                                <select
                                    value={studentAssignments[student.id] || ''}
                                    onChange={(e) => handleAssignStudent(student.id, e.target.value || null)}
                                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-48 p-1.5"
                                >
                                    <option value="">Sin grupo</option>
                                    {practiceGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                </select>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                     <h2 className="text-xl font-semibold text-gray-700 sticky top-0 bg-gray-50 py-2 -mt-2 z-10">Composición de Grupos</h2>
                    {studentsWithoutGroup.length > 0 && (
                        <div className={`p-4 rounded-lg border-2 border-dashed bg-red-100 border-red-300`}>
                            <h3 className="font-bold text-red-800">Alumnos sin Grupo ({studentsWithoutGroup.length})</h3>
                        </div>
                    )}
                    {practiceGroups.map(group => {
                        const members = students.filter(s => studentAssignments[s.id] === group.id);
                        return (
                            <div key={group.id} className={`p-4 rounded-lg shadow-sm border ${group.color}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-gray-800">{group.name} ({members.length} miembros)</h3>
                                    <button onClick={() => handleDeleteGroup(group.id)} className="text-gray-500 hover:text-red-600">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                                <ul className="text-sm text-gray-700 list-disc list-inside">
                                    {members.map(m => <li key={m.id}>- {`${m.apellido1} ${m.apellido2}, ${m.nombre}`}</li>)}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default DefinirGrupos;
