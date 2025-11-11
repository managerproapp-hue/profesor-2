import React, { useMemo, useCallback } from 'react';
import { Student } from '../types';
import { SERVICE_GRADE_WEIGHTS } from '../data/constants';
import { ExportIcon } from '../components/icons';
import { downloadPdfWithTables } from '../components/printUtils';
import { useAppContext } from '../context/AppContext';

declare var XLSX: any;

interface NotasServicioViewProps {
    onNavigateToService: (serviceId: string, tab: 'evaluation') => void;
}

const NotasServicioView: React.FC<NotasServicioViewProps> = ({ onNavigateToService }) => {
    const { students, services, practiceGroups, serviceEvaluations, teacherData, instituteData } = useAppContext();
    
    const sortedServices = useMemo(() => {
        return [...services].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [services]);

    const studentData = useMemo(() => {
        const studentGroups = students.reduce((acc, student) => {
            (acc[student.grupo] = acc[student.grupo] || []).push(student);
            return acc;
        }, {} as Record<string, Student[]>);

        Object.keys(studentGroups).forEach(groupName => {
            studentGroups[groupName].sort((a,b) => a.apellido1.localeCompare(b.apellido1));
        });

        const getScores = (student: Student) => {
            const serviceScores: Record<string, { group: number | null, individual: number | null, absent: boolean }> = {};
            const gradesByTrimester: {
                t1: { individual: number[], group: number[] },
                t2: { individual: number[], group: number[] },
                t3: { individual: number[], group: number[] }
            } = {
                t1: { individual: [], group: [] },
                t2: { individual: [], group: [] },
                t3: { individual: [], group: [] }
            };
            
            sortedServices.forEach(service => {
                const evaluation = serviceEvaluations.find(e => e.serviceId === service.id);
                const individualEval = evaluation?.serviceDay.individualScores[student.id];

                if (individualEval && individualEval.attendance === false) {
                    serviceScores[service.id] = { group: null, individual: null, absent: true };
                    return;
                }

                let individualGrade: number | null = null;
                if (individualEval) individualGrade = (individualEval.scores || []).reduce((sum, score) => sum + (score || 0), 0);
                
                let groupGrade: number | null = null;
                const practiceGroup = practiceGroups.find(pg => pg.studentIds.includes(student.id));
                if (practiceGroup && evaluation) {
                    const groupEval = evaluation.serviceDay.groupScores[practiceGroup.id];
                    if (groupEval) groupGrade = (groupEval.scores || []).reduce((sum, score) => sum + (score || 0), 0);
                }
                
                serviceScores[service.id] = { group: groupGrade, individual: individualGrade, absent: false };
                
                const trimester = service.trimester;
                if (trimester) {
                    if (individualGrade !== null) {
                        gradesByTrimester[trimester].individual.push(individualGrade);
                    }
                    if (groupGrade !== null) {
                        gradesByTrimester[trimester].group.push(groupGrade);
                    }
                }
            });

            const calculateAverage = (grades: number[]) => grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : null;

            const averages = {
                t1: {
                    individual: calculateAverage(gradesByTrimester.t1.individual),
                    group: calculateAverage(gradesByTrimester.t1.group)
                },
                t2: {
                    individual: calculateAverage(gradesByTrimester.t2.individual),
                    group: calculateAverage(gradesByTrimester.t2.group)
                },
                t3: {
                    individual: calculateAverage(gradesByTrimester.t3.individual),
                    group: calculateAverage(gradesByTrimester.t3.group)
                },
            };
            
            return { serviceScores, averages };
        };
        return { studentGroups, getScores };
    }, [students, sortedServices, practiceGroups, serviceEvaluations]);
    
    const handleExport = (format: 'pdf' | 'xlsx') => {
        const title = "Resumen de Notas de Servicio";
        const head = [["Alumno", ...sortedServices.map(s => s.name), "Media Ind T1", "Media Grup T1", "Media Ind T2", "Media Grup T2", "Media Ind T3", "Media Grup T3"]];

        const body = Object.values(studentData.studentGroups).flat().map((student: Student) => {
             const { serviceScores, averages } = studentData.getScores(student);
            const row: (string | number | null)[] = [`${student.apellido1} ${student.apellido2}, ${student.nombre}`];
            sortedServices.forEach(service => {
                const scores = serviceScores[service.id];
                 if (!scores) {
                     row.push("-");
                 } else if (scores.absent) {
                    row.push("AUSENTE");
                } else {
                    const indStr = scores.individual?.toFixed(2) ?? '-';
                    const groupStr = scores.group?.toFixed(2) ?? '-';
                    row.push(format === 'pdf' ? `I:${indStr}\nG:${groupStr}` : `I: ${indStr} / G: ${groupStr}`);
                }
            });
            row.push(averages.t1.individual?.toFixed(2) ?? '-');
            row.push(averages.t1.group?.toFixed(2) ?? '-');
            row.push(averages.t2.individual?.toFixed(2) ?? '-');
            row.push(averages.t2.group?.toFixed(2) ?? '-');
            row.push(averages.t3.individual?.toFixed(2) ?? '-');
            row.push(averages.t3.group?.toFixed(2) ?? '-');
            return row;
        });

        if (format === 'pdf') {
            downloadPdfWithTables(title, [head], [body], teacherData, instituteData);
        } else {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([head[0], ...body]);
            XLSX.utils.book_append_sheet(wb, ws, title);
            XLSX.writeFile(wb, `${title.replace(/ /g, '_')}.xlsx`);
        }
    };

    return (
        <div>
            <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Resumen de Servicios</h1>
                    <p className="text-gray-500 mt-1">Vista general de todas las evaluaciones. Haz clic en un servicio para editar.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => handleExport('pdf')} disabled={sortedServices.length === 0} className="flex items-center bg-red-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-600 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"><ExportIcon className="w-4 h-4 mr-1" /> PDF</button>
                    <button onClick={() => handleExport('xlsx')} disabled={sortedServices.length === 0} className="flex items-center bg-green-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-700 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"><ExportIcon className="w-4 h-4 mr-1" /> XLSX</button>
                </div>
            </header>
            {sortedServices.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-lg shadow">
                    <h2 className="text-2xl font-bold text-gray-700">No hay servicios planificados</h2>
                    <p className="text-gray-500 mt-2">Crea tu primer servicio en la sección de "Gestión Práctica" para empezar a calificar.</p>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                    <table className="min-w-full text-xs text-center border-collapse">
                        <thead className="bg-gray-100 sticky top-0 z-10">
                            <tr>
                                <th rowSpan={2} className="p-2 border font-semibold text-gray-600 w-48 text-left sticky left-0 bg-gray-100">Alumno</th>
                                {sortedServices.map(service => (
                                    <th key={service.id} rowSpan={2} className="p-2 border font-semibold text-gray-600 min-w-[120px]">
                                        <button onClick={() => onNavigateToService(service.id, 'evaluation')} className="hover:text-blue-600 w-full">
                                            <span className="font-bold">{service.name}</span><br />
                                            <span className="font-normal text-gray-500">{new Date(service.date.replace(/-/g, '/')).toLocaleDateString('es-ES')}</span>
                                        </button>
                                    </th>
                                ))}
                                <th colSpan={2} className="p-2 border font-semibold text-gray-600 bg-gray-200">Media T1</th>
                                <th colSpan={2} className="p-2 border font-semibold text-gray-600 bg-gray-200">Media T2</th>
                                <th colSpan={2} className="p-2 border font-semibold text-gray-600 bg-gray-200">Media T3</th>
                            </tr>
                            <tr>
                                <th className="p-2 border font-semibold text-gray-500 bg-gray-200 text-xs">Ind.</th>
                                <th className="p-2 border font-semibold text-gray-500 bg-gray-200 text-xs">Grup.</th>
                                <th className="p-2 border font-semibold text-gray-500 bg-gray-200 text-xs">Ind.</th>
                                <th className="p-2 border font-semibold text-gray-500 bg-gray-200 text-xs">Grup.</th>
                                <th className="p-2 border font-semibold text-gray-500 bg-gray-200 text-xs">Ind.</th>
                                <th className="p-2 border font-semibold text-gray-500 bg-gray-200 text-xs">Grup.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(studentData.studentGroups).map(([groupName, studentsInGroup]: [string, Student[]]) => (
                                <React.Fragment key={groupName}>
                                    <tr><td colSpan={sortedServices.length + 7} className="bg-gray-200 font-bold p-1 text-left pl-4">{groupName}</td></tr>
                                    {studentsInGroup.map(student => {
                                        const { serviceScores, averages } = studentData.getScores(student);
                                        return (
                                        <tr key={student.id} className="hover:bg-gray-50 group">
                                            <td className="p-1 border text-left font-semibold text-gray-800 w-48 sticky left-0 bg-white group-hover:bg-gray-50">{`${student.apellido1} ${student.apellido2}, ${student.nombre}`}</td>
                                            {sortedServices.map(service => {
                                                const scores = serviceScores[service.id];
                                                return (
                                                    <td key={service.id} className="p-1 border">
                                                        {!scores ? '-' : scores.absent ? <span className="text-red-500 font-semibold">AUSENTE</span> : (
                                                            <div>
                                                                <p>Ind: <span className="font-bold">{scores.individual?.toFixed(2) ?? '-'}</span></p>
                                                                <p>Grup: <span className="font-bold">{scores.group?.toFixed(2) ?? '-'}</span></p>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className={`p-1 border font-bold bg-gray-100 ${averages.t1.individual !== null && averages.t1.individual < 5 ? 'text-red-600' : ''}`}>{averages.t1.individual?.toFixed(2) ?? '-'}</td>
                                            <td className={`p-1 border font-bold bg-gray-100 ${averages.t1.group !== null && averages.t1.group < 5 ? 'text-red-600' : ''}`}>{averages.t1.group?.toFixed(2) ?? '-'}</td>
                                            <td className={`p-1 border font-bold bg-gray-100 ${averages.t2.individual !== null && averages.t2.individual < 5 ? 'text-red-600' : ''}`}>{averages.t2.individual?.toFixed(2) ?? '-'}</td>
                                            <td className={`p-1 border font-bold bg-gray-100 ${averages.t2.group !== null && averages.t2.group < 5 ? 'text-red-600' : ''}`}>{averages.t2.group?.toFixed(2) ?? '-'}</td>
                                            <td className={`p-1 border font-bold bg-gray-100 ${averages.t3.individual !== null && averages.t3.individual < 5 ? 'text-red-600' : ''}`}>{averages.t3.individual?.toFixed(2) ?? '-'}</td>
                                            <td className={`p-1 border font-bold bg-gray-100 ${averages.t3.group !== null && averages.t3.group < 5 ? 'text-red-600' : ''}`}>{averages.t3.group?.toFixed(2) ?? '-'}</td>
                                        </tr>
                                    )})}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default NotasServicioView;