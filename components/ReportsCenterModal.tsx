import React, { useState, useEffect, useMemo } from 'react';
import { Service, ServiceEvaluation, ReportViewModel, Student } from '../types';
import { useAppContext } from '../context/AppContext';
import { XIcon, DownloadIcon, FileTextIcon, UsersIcon } from './icons';
import { generatePlanningPDF, generateTrackingSheetPDF, generateDetailedStudentServiceReportPDF, generateAllDetailedStudentReportsPDF, generateFullEvaluationReportPDF } from '../services/reportGenerator';


interface ReportsCenterModalProps {
    service: Service;
    evaluation: ServiceEvaluation;
    onClose: () => void;
}

type ReportType = 'planning' | 'trackingSheet' | 'detailedStudentReport' | 'fullEvaluation';

const REPORTS: { id: ReportType; name: string; description: string }[] = [
    {
        id: 'planning',
        name: 'Planning del Servicio',
        description: 'Genera un documento con la distribución de grupos, las elaboraciones asignadas a cada uno y los puestos de cada alumno.'
    },
    {
        id: 'trackingSheet',
        name: 'Ficha de Seguimiento Semanal',
        description: 'Crea la ficha de seguimiento para la evaluación previa al servicio, incluyendo asistencia, materiales y conducta.'
    },
    {
        id: 'fullEvaluation',
        name: 'Ficha de Evaluación de Servicio',
        description: 'Genera un informe completo con las evaluaciones grupales e individuales de todos los participantes del servicio.'
    },
    {
        id: 'detailedStudentReport',
        name: 'Informe Detallado por Alumno',
        description: 'Genera un informe exhaustivo con la evaluación individual, grupal y las incidencias de un alumno específico para este servicio.'
    }
];

const ReportsCenterModal: React.FC<ReportsCenterModalProps> = ({ service, evaluation, onClose }) => {
    const { students, practiceGroups, serviceRoles, teacherData, instituteData, entryExitRecords } = useAppContext();
    const [activeReport, setActiveReport] = useState<ReportType | null>(null);
    const [viewModel, setViewModel] = useState<ReportViewModel | null>(null);
    const [selectedStudentForReport, setSelectedStudentForReport] = useState<string>('__ALL__');


    useEffect(() => {
        // --- VIEWMODEL CREATION ---
        const normalizedService: Service = {
            ...service,
            assignedGroups: service.assignedGroups ?? { comedor: [], takeaway: [] },
            elaborations: service.elaborations ?? { comedor: [], takeaway: [] },
            studentRoles: service.studentRoles ?? [],
            isLocked: service.isLocked ?? false,
        };

        const normalizedEvaluation: ServiceEvaluation = {
            ...evaluation,
            preService: evaluation.preService ?? {},
            serviceDay: evaluation.serviceDay ?? { groupScores: {}, individualScores: {} },
        };

        const assignedGroupIds = [...(normalizedService.assignedGroups.comedor || []), ...(normalizedService.assignedGroups.takeaway || [])];
        const participatingGroups = practiceGroups.filter(g => assignedGroupIds.includes(g.id));
        const participatingStudentIds = new Set(participatingGroups.flatMap(g => g.studentIds));
        const participatingStudents = students.filter(s => participatingStudentIds.has(s.id))
            .sort((a, b) => a.apellido1.localeCompare(b.apellido1));
        
        const groupedStudentsInService = practiceGroups
            .filter(g => assignedGroupIds.includes(g.id))
            .map(group => ({
                group,
                students: students.filter(s => group.studentIds.includes(s.id))
                    .sort((a,b) => a.apellido1.localeCompare(b.apellido1))
            }));

        setViewModel({
            service: normalizedService,
            evaluation: normalizedEvaluation,
            students,
            practiceGroups,
            serviceRoles,
            teacherData,
            instituteData,
            participatingStudents,
            groupedStudentsInService,
            entryExitRecords, // Add entryExitRecords to the view model
        });
        
    }, [service, evaluation, students, practiceGroups, serviceRoles, teacherData, instituteData, entryExitRecords]);
    
     useEffect(() => {
        // Reset student selection when changing report type
        setSelectedStudentForReport('__ALL__');
    }, [activeReport]);

    const handleDownload = () => {
        if (!viewModel || !activeReport) return;

        switch (activeReport) {
            case 'planning':
                generatePlanningPDF(viewModel);
                break;
            case 'trackingSheet':
                generateTrackingSheetPDF(viewModel);
                break;
            case 'fullEvaluation':
                generateFullEvaluationReportPDF(viewModel);
                break;
            case 'detailedStudentReport':
                if (selectedStudentForReport === '__ALL__') {
                    generateAllDetailedStudentReportsPDF(viewModel);
                } else if (selectedStudentForReport) {
                    generateDetailedStudentServiceReportPDF(viewModel, selectedStudentForReport);
                } else {
                    alert('Por favor, selecciona un alumno o la opción "Todos los Alumnos".');
                }
                break;
            default:
                console.error('Unknown report type selected');
        }
    };
    
    const selectedReportDetails = useMemo(() => REPORTS.find(r => r.id === activeReport), [activeReport]);
    const isDownloadDisabled = !viewModel || (activeReport === 'detailedStudentReport' && !selectedStudentForReport);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                <header className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <FileTextIcon className="w-6 h-6 mr-3 text-purple-600" />
                        Centro de Informes: {service.name}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
                        <XIcon className="w-6 h-6 text-gray-600" />
                    </button>
                </header>
                <div className="flex flex-1 overflow-hidden">
                    <aside className="w-1/3 border-r bg-gray-50 overflow-y-auto">
                        <nav className="p-4 space-y-2">
                            <h3 className="px-2 text-sm font-semibold text-gray-500">Informes Disponibles</h3>
                            {REPORTS.map(report => (
                                <button
                                    key={report.id}
                                    onClick={() => setActiveReport(report.id)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeReport === report.id
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {report.name}
                                </button>
                            ))}
                        </nav>
                    </aside>
                    <main className="w-2/3 flex flex-col p-6">
                        {selectedReportDetails ? (
                            <>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold text-gray-800">{selectedReportDetails.name}</h3>
                                    <p className="mt-2 text-gray-600">{selectedReportDetails.description}</p>
                                    
                                    {activeReport === 'detailedStudentReport' && viewModel?.participatingStudents && (
                                        <div className="mt-6">
                                            <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 flex items-center">
                                                <UsersIcon className="w-5 h-5 mr-2 text-gray-500" />
                                                Seleccionar Alumno(s)
                                            </label>
                                            <select
                                                id="student-select"
                                                value={selectedStudentForReport}
                                                onChange={(e) => setSelectedStudentForReport(e.target.value)}
                                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                                            >
                                                <option value="__ALL__">Todos los Alumnos</option>
                                                {viewModel.participatingStudents.map((student: Student) => (
                                                    <option key={student.id} value={student.id}>
                                                        {`${student.apellido1} ${student.apellido2}, ${student.nombre}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                </div>
                                <div className="mt-6">
                                    <button
                                        onClick={handleDownload}
                                        disabled={isDownloadDisabled}
                                        className="w-full flex items-center justify-center bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        <DownloadIcon className="w-5 h-5 mr-2" />
                                        Descargar PDF
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                <FileTextIcon className="w-16 h-16 mb-4 text-gray-300" />
                                <h3 className="text-lg font-semibold">Selecciona un informe</h3>
                                <p>Elige un tipo de informe del menú de la izquierda para ver su descripción y generar el documento.</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default ReportsCenterModal;