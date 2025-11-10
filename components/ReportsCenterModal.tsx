import React from 'react';
import { Service, ServiceEvaluation, ReportViewModel } from '../types';
import { XIcon, FileTextIcon } from './icons';
import { useAppContext } from '../context/AppContext';
import { generateServiceSheet, generateEvaluationReport } from '../services/reportGenerator';

interface ReportsCenterModalProps {
    service: Service;
    evaluation: ServiceEvaluation;
    onClose: () => void;
}

const ReportsCenterModal: React.FC<ReportsCenterModalProps> = ({ service, evaluation, onClose }) => {
    const {
        students, practiceGroups, serviceRoles, teacherData, instituteData, entryExitRecords
    } = useAppContext();

    const createViewModel = (): ReportViewModel => {
        const participatingGroupIds = new Set([...service.assignedGroups.comedor, ...service.assignedGroups.takeaway]);
        
        const groupedStudentsInService = practiceGroups
            .filter(g => participatingGroupIds.has(g.id))
            .map(group => ({
                group,
                students: students.filter(s => group.studentIds.includes(s.id))
                    .sort((a, b) => a.apellido1.localeCompare(b.apellido1) || a.nombre.localeCompare(b.nombre))
            }));

        const participatingStudents = groupedStudentsInService.flatMap(g => g.students)
            .sort((a, b) => a.apellido1.localeCompare(b.apellido1) || a.nombre.localeCompare(b.nombre));

        return {
            service,
            evaluation,
            students,
            practiceGroups,
            serviceRoles,
            teacherData,
            instituteData,
            entryExitRecords,
            participatingStudents,
            groupedStudentsInService,
        };
    };

    const handleGenerateServiceSheet = () => {
        const viewModel = createViewModel();
        generateServiceSheet(viewModel);
    };

    const handleGenerateEvaluationReport = () => {
        const viewModel = createViewModel();
        generateEvaluationReport(viewModel);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                    <h3 className="text-xl font-bold text-gray-800">Centro de Informes</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XIcon className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                    <p className="text-sm text-gray-600">Selecciona un informe para generar y descargar como PDF para el servicio: <strong>{service.name}</strong></p>
                    
                    <button onClick={handleGenerateServiceSheet} className="w-full flex items-center bg-blue-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-600 transition text-left">
                        <FileTextIcon className="w-6 h-6 mr-3"/>
                        <div>
                            <p>Ficha de Servicio</p>
                            <p className="text-xs font-normal opacity-80">Distribución de grupos, platos y puestos de trabajo.</p>
                        </div>
                    </button>

                    <button onClick={handleGenerateEvaluationReport} className="w-full flex items-center bg-green-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-600 transition text-left">
                        <FileTextIcon className="w-6 h-6 mr-3"/>
                        <div>
                            <p>Informe de Evaluación</p>
                            <p className="text-xs font-normal opacity-80">Resumen de las calificaciones grupales e individuales del día de servicio.</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportsCenterModal;
