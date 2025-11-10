import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Student, EntryExitRecord, StudentCalculatedGrades, StudentAcademicGrades, StudentCourseGrades, GradeValue, CourseModuleGrades } from '../types';
import { ACADEMIC_EVALUATION_STRUCTURE, COURSE_MODULES } from '../data/constants';
import { 
    PencilIcon,
    CameraIcon,
    SaveIcon
} from '../components/icons';

interface FichaAlumnoProps {
  student: Student;
  onBack: () => void;
  entryExitRecords: EntryExitRecord[];
  calculatedGrades: StudentCalculatedGrades;
  academicGrades?: StudentAcademicGrades;
  courseGrades?: StudentCourseGrades;
  onUpdatePhoto: (studentId: string, photoUrl: string) => void;
  onUpdateStudent: (student: Student) => void;
}

const InfoRow: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 px-4 py-3 hover:bg-gray-50">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 col-span-2">{value || '-'}</dd>
    </div>
);

const EditField: React.FC<{ label: string; name: keyof Student; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; }> = ({ label, name, value, onChange, type = 'text' }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input
            type={type}
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
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


const FichaAlumno: React.FC<FichaAlumnoProps> = ({ student, onBack, entryExitRecords, calculatedGrades, academicGrades, courseGrades, onUpdatePhoto, onUpdateStudent }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isEditing, setIsEditing] = useState(false);
  const [editedStudent, setEditedStudent] = useState<Student>(student);

  const fullName = `${student.apellido1} ${student.apellido2}, ${student.nombre}`.trim();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedStudent(student);
  }, [student]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedStudent(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onUpdateStudent(editedStudent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedStudent(student);
    setIsEditing(false);
  };

  const sortedEntryExitRecords = useMemo(() => {
    const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('/');
        return new Date(`${year}-${month}-${day}`);
    };
    return [...entryExitRecords].sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
  }, [entryExitRecords]);


  const renderGrade = (grade: number | null | undefined) => {
      if (grade === null || grade === undefined || isNaN(grade)) return <span className="text-gray-500">-</span>;
      const color = grade >= 5 ? 'text-green-600' : 'text-red-600';
      return <span className={`font-bold ${color}`}>{grade.toFixed(2)}</span>
  };
  
  const finalAverages = useMemo(() => {
    const results: { [periodKey: string]: number | null } = {};
    if (academicGrades) {
        ACADEMIC_EVALUATION_STRUCTURE.periods.forEach(period => {
            let totalWeight = 0;
            let weightedSum = 0;
            period.instruments.forEach(instrument => {
                let grade: number | null = null;
                if (instrument.type === 'manual') {
                    const manualGrade = academicGrades[period.key]?.manualGrades?.[instrument.key];
                    grade = (manualGrade === null || manualGrade === undefined) ? null : parseFloat(String(manualGrade));
                } else {
                    if (instrument.key === 'servicios') grade = calculatedGrades?.serviceAverage ?? null;
                    else {
                        const examKey = { 'exPracticoT1': 't1', 'exPracticoT2': 't2', 'exPracticoRec': 'rec' }[instrument.key] as 't1' | 't2' | 'rec';
                        if (examKey) grade = calculatedGrades?.practicalExams[examKey] ?? null;
                    }
                }
                if (grade !== null && !isNaN(grade)) {
                    weightedSum += grade * instrument.weight;
                    totalWeight += instrument.weight;
                }
            });
            results[period.key] = totalWeight > 0 ? parseFloat((weightedSum / totalWeight).toFixed(2)) : null;
        });
    }
    return results;
  }, [academicGrades, calculatedGrades]);

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
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">{fullName}</h1>
                        <p className="text-gray-500">{student.grupo} | {student.emailOficial}</p>
                    </div>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                {isEditing ? (
                    <>
                        <button onClick={handleSave} className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition">
                            <SaveIcon className="w-4 h-4 mr-2" />
                            Guardar
                        </button>
                        <button onClick={handleCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">
                            Cancelar
                        </button>
                    </>
                ) : (
                    <button onClick={() => setIsEditing(true)} className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                        <PencilIcon className="w-4 h-4 mr-2" />
                        Editar Ficha
                    </button>
                )}
                <button onClick={onBack} className="text-gray-600 hover:text-gray-800 font-medium text-2xl leading-none p-1 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100">&times;</button>
            </div>
        </header>
        
        <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-2">
                <Tab label="Información General" isActive={activeTab === 'general'} onClick={() => setActiveTab('general')} />
                <Tab label="Calificaciones" isActive={activeTab === 'calificaciones'} onClick={() => setActiveTab('calificaciones')} />
            </nav>
        </div>

        {activeTab === 'general' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
               <div className="xl:col-span-2 bg-white shadow-md rounded-lg overflow-hidden">
                   <div className="p-4 border-b"><h3 className="text-lg font-bold text-gray-800">Datos Personales</h3></div>
                   {isEditing ? (
                       <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                           <EditField label="Nombre" name="nombre" value={editedStudent.nombre} onChange={handleInputChange} />
                           <EditField label="Primer Apellido" name="apellido1" value={editedStudent.apellido1} onChange={handleInputChange} />
                           <EditField label="Segundo Apellido" name="apellido2" value={editedStudent.apellido2} onChange={handleInputChange} />
                           <EditField label="NRE" name="nre" value={editedStudent.nre} onChange={handleInputChange} />
                           <EditField label="Nº Expediente" name="expediente" value={editedStudent.expediente} onChange={handleInputChange} />
                           <EditField label="Fecha de Nacimiento" name="fechaNacimiento" value={editedStudent.fechaNacimiento} onChange={handleInputChange} type="date" />
                           <EditField label="Grupo" name="grupo" value={editedStudent.grupo} onChange={handleInputChange} />
                           <EditField label="Subgrupo" name="subgrupo" value={editedStudent.subgrupo} onChange={handleInputChange} />
                           <EditField label="Teléfono" name="telefono" value={editedStudent.telefono} onChange={handleInputChange} />
                           <EditField label="Email Personal" name="emailPersonal" value={editedStudent.emailPersonal} onChange={handleInputChange} type="email" />
                           <EditField label="Email Oficial" name="emailOficial" value={editedStudent.emailOficial} onChange={handleInputChange} type="email" />
                       </div>
                   ) : (
                        <dl className="divide-y divide-gray-200">
                           <InfoRow label="NRE" value={student.nre} /><InfoRow label="Nº Expediente" value={student.expediente} /><InfoRow label="Fecha de Nacimiento" value={student.fechaNacimiento} /><InfoRow label="Teléfono" value={student.telefono} /><InfoRow label="Email Personal" value={student.emailPersonal} />
                        </dl>
                   )}
               </div>
               <div className="space-y-6">
                   <div className="bg-white shadow-md rounded-lg p-4">
                       <h3 className="text-md font-bold text-gray-800 mb-2 text-orange-600">Registro de Salidas y Entradas</h3>
                       {sortedEntryExitRecords.length > 0 ? (<div className="max-h-48 overflow-y-auto pr-2 space-y-2 text-sm">{sortedEntryExitRecords.map(record => (<div key={record.id} className="p-2 bg-gray-50 rounded-md"><p className="font-semibold">{record.date} - <span className={record.type === 'Salida Anticipada' ? 'text-red-600' : 'text-blue-600'}>{record.type}</span></p><p className="text-gray-600 break-words">{record.reason}</p></div>))}</div>) : (<p className="text-sm text-gray-500">No hay registros.</p>)}
                   </div>
               </div>
            </div>
        )}

        {activeTab === 'calificaciones' && (
            <div className="space-y-8">
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <div className="p-4 border-b"><h3 className="text-lg font-bold text-gray-800">Resumen Final del Módulo Principal</h3></div>
                     <dl className="divide-y divide-gray-200">
                        <InfoRow label="Media de Servicios Prácticos" value={renderGrade(calculatedGrades?.serviceAverage)} />
                        <InfoRow label="Media Ex. Práctico (T1)" value={renderGrade(calculatedGrades?.practicalExams.t1)} />
                        <InfoRow label="Media Ex. Práctico (T2)" value={renderGrade(calculatedGrades?.practicalExams.t2)} />
                        <InfoRow label="Media Ex. Práctico (REC)" value={renderGrade(calculatedGrades?.practicalExams.rec)} />
                    </dl>
                </div>

                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-800 p-4 border-b">Desglose de Calificaciones (Módulo Principal)</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-center">
                            <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left">Instrumento</th>
                                    {ACADEMIC_EVALUATION_STRUCTURE.periods.map(p => <th key={p.key} className="px-4 py-3">{p.name}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {ACADEMIC_EVALUATION_STRUCTURE.periods[0].instruments.map(instrument => (
                                    <tr key={instrument.key}>
                                        <td className="px-4 py-2 text-left font-medium">{instrument.name} ({instrument.weight * 100}%)</td>
                                        {ACADEMIC_EVALUATION_STRUCTURE.periods.map(period => {
                                            let grade: GradeValue | undefined = null;
                                            if (period.instruments.some(i => i.key === instrument.key)) {
                                                if (instrument.type === 'manual') grade = academicGrades?.[period.key]?.manualGrades?.[instrument.key];
                                                else {
                                                    if (instrument.key === 'servicios') grade = calculatedGrades?.serviceAverage;
                                                    else {
                                                         const examKey = { 'exPracticoT1': 't1', 'exPracticoT2': 't2', 'exPracticoRec': 'rec' }[instrument.key] as 't1' | 't2' | 'rec';
                                                         if(examKey) grade = calculatedGrades?.practicalExams[examKey];
                                                    }
                                                }
                                            }
                                            return <td key={`${period.key}-${instrument.key}`} className="px-4 py-2">{renderGrade(grade as number)}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                             <tfoot className="bg-gray-100 font-bold">
                                <tr>
                                    <td className="px-4 py-2 text-left">MEDIA PONDERADA</td>
                                    {ACADEMIC_EVALUATION_STRUCTURE.periods.map(p => <td key={p.key} className="px-4 py-2">{renderGrade(finalAverages[p.key])}</td>)}
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                 <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <h3 className="text-lg font-bold text-gray-800 p-4 border-b">Calificaciones de Otros Módulos</h3>
                     <div className="overflow-x-auto">
                           <table className="min-w-full text-sm text-center">
                                <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Módulo</th><th className="px-4 py-3">T1</th><th className="px-4 py-3">T2</th><th className="px-4 py-3">T3</th><th className="px-4 py-3">REC</th><th className="px-4 py-3">Media Final</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {COURSE_MODULES.map(mod => {
                                        const grades = courseGrades?.[mod] || {};
                                        const validGrades = (Object.values(grades) as (GradeValue | undefined)[]).map(g => parseFloat(String(g))).filter(g => !isNaN(g));
                                        const finalAvg = validGrades.length > 0 ? (validGrades.reduce((a, b) => a + b, 0) / validGrades.length) : null;
                                        return (
                                            <tr key={mod}><td className="px-4 py-2 text-left font-medium">{mod}</td><td>{renderGrade(grades.t1)}</td><td>{renderGrade(grades.t2)}</td><td>{renderGrade(grades.t3)}</td><td>{renderGrade(grades.rec)}</td><td className="font-bold bg-gray-50">{renderGrade(finalAvg)}</td></tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default FichaAlumno;