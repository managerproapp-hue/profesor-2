import React, { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Student } from '../types';
import { FileTextIcon } from '../components/icons';
import { useAppContext } from '../context/AppContext';

// PDF Generation Logic
const generateStudentPdf = (
    student: Student,
    context: ReturnType<typeof useAppContext>
) => {
    const { services, serviceEvaluations, practiceGroups, entryExitRecords, calculatedStudentGrades, teacherData, instituteData } = context;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let lastY = 0;

    const addImageToPdf = (imageData: string | null, x: number, y: number, w: number, h: number) => {
        if (imageData && imageData.startsWith('data:image')) {
            try {
                const imageType = imageData.substring(imageData.indexOf('/') + 1, imageData.indexOf(';'));
                doc.addImage(imageData, imageType.toUpperCase(), x, y, w, h);
            } catch (e) { console.error("Error adding image:", e); }
        }
    };

    const addPageHeader = () => {
        doc.setFontSize(10);
        doc.setTextColor(100);
        addImageToPdf(instituteData.logo, pageMargin, 10, 15, 15);
        doc.text(instituteData.name || 'Nombre del Centro', pageMargin + 17, 15);
        doc.text(instituteData.address || 'Dirección del Centro', pageMargin + 17, 20);
        addImageToPdf(teacherData.logo, pageWidth - pageMargin - 15, 10, 15, 15);
        doc.text(teacherData.name || 'Nombre del Profesor', pageWidth - pageMargin - 17, 15, { align: 'right' });
        doc.setDrawColor(180);
        doc.line(pageMargin, 28, pageWidth - pageMargin, 28);
    }
    
    const addPageFooter = (pageNumber: number) => {
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    const didDrawPage = (data: any) => {
        addPageHeader();
        addPageFooter(data.pageNumber);
    };

    addPageHeader();
    let startY = 35;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40);
    doc.text('FICHA ACADÉMICA INDIVIDUAL', pageWidth / 2, startY, { align: 'center' });
    startY += 10;
    
    addImageToPdf(student.fotoUrl, pageMargin, startY, 30, 30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${student.nombre} ${student.apellido1} ${student.apellido2}`, pageMargin + 35, startY + 8);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`NRE: ${student.nre}`, pageMargin + 35, startY + 15);
    doc.text(`Grupo: ${student.grupo}`, pageMargin + 35, startY + 22);
    startY += 40;

    const grades = calculatedStudentGrades[student.id];
    const summaryBody = [
        ['Media de Servicios Prácticos', grades?.serviceAverage?.toFixed(2) ?? '-'],
        ['Examen Práctico T1', grades?.practicalExams.t1?.toFixed(2) ?? '-'],
        ['Examen Práctico T2', grades?.practicalExams.t2?.toFixed(2) ?? '-'],
        ['Examen Práctico REC', grades?.practicalExams.rec?.toFixed(2) ?? '-'],
    ];

    (doc as any).autoTable({ startY: startY, head: [['Resumen de Calificaciones', 'Nota']], body: summaryBody, theme: 'grid', headStyles: { fillColor: [41, 128, 185] }, didDrawPage: didDrawPage });
    lastY = (doc as any).lastAutoTable.finalY;

    const studentServices = services.map(service => {
        const evalData = serviceEvaluations.find(e => e.serviceId === service.id);
        const indEval = evalData?.serviceDay?.individualScores?.[student.id];
        if (!indEval || !indEval.attendance) return null;
        const indScore = (indEval.scores || []).reduce((sum, s) => sum + (s || 0), 0);
        const studentGroup = practiceGroups.find(pg => pg.studentIds.includes(student.id));
        let groupScore: number | null = null;
        if(studentGroup) {
            const groupEval = evalData?.serviceDay?.groupScores?.[studentGroup.id];
            if(groupEval) groupScore = (groupEval.scores || []).reduce((sum, s) => sum + (s || 0), 0);
        }
        return [new Date(service.date).toLocaleDateString('es-ES'), service.name, indScore.toFixed(2), groupScore?.toFixed(2) ?? '-'];
    }).filter(Boolean);
    
    if (studentServices.length > 0) {
        (doc as any).autoTable({ startY: lastY + 10, head: [['Fecha', 'Servicio', 'Nota Individual', 'Nota Grupal']], body: studentServices, theme: 'striped', headStyles: { fillColor: [34, 139, 34] }, didDrawPage: didDrawPage });
        lastY = (doc as any).lastAutoTable.finalY;
    }

    const parseIncidentDate = (dateStr: string): Date => {
        const parts = dateStr.split('/');
        return parts.length === 3 ? new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10)) : new Date(dateStr);
    };

    const studentIncidents = entryExitRecords.filter(r => r.studentId === student.id).map(r => [r.date, r.type, r.reason]).sort((a,b) => parseIncidentDate(a[0]).getTime() - parseIncidentDate(b[0]).getTime());
    if(studentIncidents.length > 0) {
        (doc as any).autoTable({ startY: lastY + 10, head: [['Fecha', 'Tipo', 'Motivo']], body: studentIncidents, theme: 'striped', headStyles: { fillColor: [255, 165, 0] }, didDrawPage: didDrawPage });
    }

    addPageFooter(1);
    doc.save(`Informe_${student.apellido1}_${student.nombre}.pdf`);
};

const InformesView: React.FC = () => {
    const context = useAppContext();
    const { students } = context;
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');

    const sortedStudents = [...students].sort((a, b) => 
        a.apellido1.localeCompare(b.apellido1) || a.apellido2.localeCompare(b.apellido2) || a.nombre.localeCompare(b.nombre)
    );

    const handleGenerateReport = () => {
        if (!selectedStudentId) {
            alert('Por favor, selecciona un alumno.');
            return;
        }
        const student = students.find(s => s.id === selectedStudentId);
        if (student) {
            generateStudentPdf(student, context);
        }
    };
    
    return (
        <div>
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <FileTextIcon className="w-8 h-8 mr-3 text-blue-500" />
                    Centro de Informes
                </h1>
                <p className="text-gray-500 mt-1">Genera informes y resúmenes de la actividad académica.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Informe Individual de Alumno</h2>
                    <p className="text-sm text-gray-600 mb-4">Genera una ficha académica completa en formato PDF para un alumno específico.</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-1">Seleccionar Alumno</label>
                            <select
                                id="student-select"
                                value={selectedStudentId}
                                onChange={(e) => setSelectedStudentId(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                disabled={students.length === 0}
                            >
                                <option value="">{students.length > 0 ? 'Elige un alumno...' : 'No hay alumnos cargados'}</option>
                                {sortedStudents.map(student => (
                                    <option key={student.id} value={student.id}>
                                        {`${student.apellido1} ${student.apellido2}, ${student.nombre}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={handleGenerateReport}
                            disabled={!selectedStudentId}
                            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Generar PDF
                        </button>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm opacity-50 flex flex-col justify-center items-center">
                     <h2 className="text-xl font-bold text-gray-400 mb-4">Resumen del Grupo/Clase</h2>
                     <p className="text-sm text-gray-500 text-center">Próximamente: genera un informe con las notas finales de toda la clase.</p>
                </div>
            </div>
        </div>
    );
};

export default InformesView;