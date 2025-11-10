import React, { useState, useCallback, useRef } from 'react';
import { Student, EntryExitRecord, PrincipalGrades, OtherGrades, PrincipalGrade, OtherModuleGrade, GradeValue } from '../types';
import { 
    PencilIcon,
    PlusIcon,
    CameraIcon
} from '../components/icons';

interface FichaAlumnoProps {
  student: Student;
  onBack: () => void;
  entryExitRecords: EntryExitRecord[];
  principalGrades: PrincipalGrades[string];
  otherGrades: OtherGrades[string];
  onUpdatePhoto: (studentId: string, photoUrl: string) => void;
}

// --- Constants & Helpers ---
const OTHER_MODULES = ['FOL', 'Inglés Técnico', 'EIE'];
const WEIGHTS = { servicios: 0.4, practico: 0.3, teorico1: 0.15, teorico2: 0.15 };

const calculateWeightedAverage = (grades: PrincipalGrade): string => {
    if (!grades) return '-';
    let totalWeight = 0;
    let weightedSum = 0;
    
    const g = {
      servicios: parseFloat(String(grades.servicios)),
      practico: parseFloat(String(grades.practico)),
      teorico1: parseFloat(String(grades.teorico1)),
      teorico2: parseFloat(String(grades.teorico2)),
    };

    if (!isNaN(g.servicios)) { weightedSum += g.servicios * WEIGHTS.servicios; totalWeight += WEIGHTS.servicios; }
    if (!isNaN(g.practico)) { weightedSum += g.practico * WEIGHTS.practico; totalWeight += WEIGHTS.practico; }
    if (!isNaN(g.teorico1)) { weightedSum += g.teorico1 * WEIGHTS.teorico1; totalWeight += WEIGHTS.teorico1; }
    if (!isNaN(g.teorico2)) { weightedSum += g.teorico2 * WEIGHTS.teorico2; totalWeight += WEIGHTS.teorico2; }
    
    if (totalWeight === 0) return '-';
    
    const average = weightedSum / totalWeight;
    return average.toFixed(2);
};
  
const calculateSimpleAverage = (grades: OtherModuleGrade): string => {
      if (!grades) return '-';
      const validGrades = [grades.t1, grades.t2, grades.t3]
        .map(g => parseFloat(String(g)))
        .filter(g => !isNaN(g) && g >= 5);
      
      if (validGrades.length === 0) return '-';
      
      const sum = validGrades.reduce((acc, curr) => acc + curr, 0);
      return (sum / validGrades.length).toFixed(2);
};

const InfoRow: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 px-4 py-3 hover:bg-gray-50">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 col-span-2">{value || '-'}</dd>
    </div>
);

const Tab: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-medium text-sm rounded-md transition-colors
            ${isActive
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
    >
        {label}
    </button>
);

const FichaAlumno: React.FC<FichaAlumnoProps> = ({ student, onBack, entryExitRecords, principalGrades, otherGrades, onUpdatePhoto }) => {
  const [activeTab, setActiveTab] = useState('general');
  const fullName = `${student.apellido1} ${student.apellido2}, ${student.nombre}`.trim();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result;
        if (typeof result === 'string') {
          onUpdatePhoto(student.id, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div>
        <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div>
                <div className="flex items-center">
                    <div className="relative group cursor-pointer" onClick={handlePhotoClick}>
                        <img className="h-16 w-16 rounded-full object-cover mr-4" src={student.fotoUrl} alt={`Foto de ${fullName}`} />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 rounded-full flex items-center justify-center transition-opacity duration-300">
                            <CameraIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{fullName}</h1>
                        <p className="text-gray-500">{student.grupo} | {student.emailOficial}</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                    <PencilIcon className="w-4 h-4 mr-2" />
                    Editar Ficha
                </button>
                <button onClick={onBack} className="text-gray-600 hover:text-gray-800 font-medium text-2xl leading-none p-1 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">
                    &times;
                </button>
            </div>
        </header>

        <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-2">
                <Tab label="Información General" isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} />
                <Tab label="Resumen Académico" isActive={activeTab === 'academico'} onClick={() => setActiveTab('academico')} />
            </nav>
        </div>

        {activeTab === 'general' && (
             <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-bold text-gray-800">Datos Personales</h3>
                    </div>
                    <dl className="divide-y divide-gray-200">
                        <InfoRow label="NRE" value={student.nre} />
                        <InfoRow label="Nº Expediente" value={student.expediente} />
                        <InfoRow label="Fecha de Nacimiento" value={student.fechaNacimiento} />
                        <InfoRow label="Teléfono" value={student.telefono} />
                        <InfoRow label="Email Personal" value={student.emailPersonal} />
                    </dl>
                </div>
                <div className="space-y-6">
                    <div className="bg-white shadow-md rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-md font-bold text-gray-800">Entrevistas y Tutorías</h3>
                            <button className="flex items-center text-sm text-green-600 hover:text-green-800">
                                <PlusIcon className="w-4 h-4 mr-1" /> Añadir
                            </button>
                        </div>
                        <p className="text-sm text-gray-500">No hay entrevistas.</p>
                    </div>
                    <div className="bg-white shadow-md rounded-lg p-4">
                        <h3 className="text-md font-bold text-gray-800 mb-2 text-orange-600">Registro de Salidas y Entradas</h3>
                        {entryExitRecords.length > 0 ? (
                             <div className="max-h-48 overflow-y-auto pr-2 space-y-2 text-sm">
                                {entryExitRecords.map(record => (
                                    <div key={record.id} className="p-2 bg-gray-50 rounded-md">
                                        <p className="font-semibold">{record.date} - <span className={record.type === 'Salida Anticipada' ? 'text-red-600' : 'text-blue-600'}>{record.type}</span></p>
                                        <p className="text-gray-600 break-words">{record.reason}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">No hay registros.</p>
                        )}
                    </div>
                </div>
             </div>
        )}
        
        {activeTab === 'academico' && (
            <div className="space-y-8">
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-800 p-4 border-b">Resumen del Módulo Principal</h3>
                    {principalGrades ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm text-center">
                                <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Calificación</th>
                                        <th className="px-4 py-3">Trimestre 1</th>
                                        <th className="px-4 py-3">Trimestre 2</th>
                                        <th className="px-4 py-3">Trimestre 3</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-4 py-2 text-left font-medium">Servicios (40%)</td>
                                        <td>{principalGrades.t1?.servicios || '-'}</td>
                                        <td>{principalGrades.t2?.servicios || '-'}</td>
                                        <td>{principalGrades.t3?.servicios || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-left font-medium">Ex. Práctico (30%)</td>
                                        <td>{principalGrades.t1?.practico || '-'}</td>
                                        <td>{principalGrades.t2?.practico || '-'}</td>
                                        <td>{principalGrades.t3?.practico || '-'}</td>
                                    </tr>
                                     <tr>
                                        <td className="px-4 py-2 text-left font-medium">Ex. Teórico 1 (15%)</td>
                                        <td>{principalGrades.t1?.teorico1 || '-'}</td>
                                        <td>{principalGrades.t2?.teorico1 || '-'}</td>
                                        <td>{principalGrades.t3?.teorico1 || '-'}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-4 py-2 text-left font-medium">Ex. Teórico 2 (15%)</td>
                                        <td>{principalGrades.t1?.teorico2 || '-'}</td>
                                        <td>{principalGrades.t2?.teorico2 || '-'}</td>
                                        <td>{principalGrades.t3?.teorico2 || '-'}</td>
                                    </tr>
                                </tbody>
                                <tfoot className="bg-gray-100 font-bold">
                                     <tr>
                                        <td className="px-4 py-2 text-left">Media Ponderada</td>
                                        <td>{calculateWeightedAverage(principalGrades.t1)}</td>
                                        <td>{calculateWeightedAverage(principalGrades.t2)}</td>
                                        <td>{calculateWeightedAverage(principalGrades.t3)}</td>
                                    </tr>
                                     <tr>
                                        <td className="px-4 py-2 text-left text-blue-600">Recuperación Final</td>
                                        <td colSpan={3} className="text-blue-600">{principalGrades.recFinal || '-'}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    ) : (
                        <p className="p-4 text-sm text-gray-500">No hay datos de calificación para este módulo.</p>
                    )}
                </div>
                 <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-800 p-4 border-b">Resumen de Otros Módulos</h3>
                     {otherGrades ? (
                        <div className="overflow-x-auto">
                           <table className="min-w-full text-sm text-center">
                                <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Módulo</th>
                                        <th className="px-4 py-3">T1</th>
                                        <th className="px-4 py-3">T2</th>
                                        <th className="px-4 py-3">T3</th>
                                        <th className="px-4 py-3">REC</th>
                                        <th className="px-4 py-3">Media Final</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {OTHER_MODULES.map(mod => {
                                        const grades = otherGrades[mod];
                                        return (
                                            <tr key={mod}>
                                                <td className="px-4 py-2 text-left font-medium">{mod}</td>
                                                <td>{grades?.t1 || '-'}</td>
                                                <td>{grades?.t2 || '-'}</td>
                                                <td>{grades?.t3 || '-'}</td>
                                                <td>{grades?.rec || '-'}</td>
                                                <td className="font-bold bg-gray-50">{calculateSimpleAverage(grades)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="p-4 text-sm text-gray-500">No hay datos de calificación para otros módulos.</p>
                    )}
                </div>
            </div>
        )}
    </div>
  );
};

export default FichaAlumno;
