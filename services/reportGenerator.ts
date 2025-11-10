import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportViewModel } from '../types';
import { PRE_SERVICE_BEHAVIOR_ITEMS } from '../data/constants';

// --- Reusable PDF Generation Helpers ---

const addImageToPdf = (doc: jsPDF, imageData: string | null, x: number, y: number, w: number, h: number) => {
    if (imageData && imageData.startsWith('data:image')) {
        try {
            const imageType = imageData.substring(imageData.indexOf('/') + 1, imageData.indexOf(';'));
            doc.addImage(imageData, imageType.toUpperCase(), x, y, w, h);
        } catch (e) { console.error("Error adding image:", e); }
    }
};

const getPageHeaderFooterCallback = (viewModel: ReportViewModel, title: string) => {
    const { teacherData, instituteData } = viewModel;
    const pageMargin = 15;
    
    return (data: any) => {
        const doc = data.doc;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // --- HEADER ---
        addImageToPdf(doc, instituteData.logo, pageMargin, 10, 15, 15);
        addImageToPdf(doc, teacherData.logo, pageWidth - pageMargin - 15, 10, 15, 15);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(instituteData.name || 'Nombre del Centro', pageMargin + 17, 15);
        doc.text(teacherData.name || 'Nombre del Profesor', pageWidth - pageMargin - 17, 15, { align: 'right' });
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40);
        doc.text(title, pageWidth / 2, 25, { align: 'center' });
        
        doc.setDrawColor(180);
        doc.line(pageMargin, 32, pageWidth - pageMargin, 32);

        // --- FOOTER ---
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.line(pageMargin, pageHeight - 15, pageWidth - pageMargin, pageHeight - 15);
        doc.text(`Página ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        const date = new Date().toLocaleDateString('es-ES');
        doc.text(date, pageWidth - pageMargin, pageHeight - 10, { align: 'right' });
    };
};

// --- Specific Report Generation Functions ---

export const generatePlanningPDF = (viewModel: ReportViewModel) => {
    const { service, serviceRoles, groupedStudentsInService } = viewModel;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let lastY = 40;

    const didDrawPage = getPageHeaderFooterCallback(viewModel, `Planning del Servicio: ${service.name}`);

    // Groups & Elaborations
    const elaborationsBody = [];
    const comedorGroups = service.assignedGroups.comedor.map(id => viewModel.practiceGroups.find(g => g.id === id)?.name).filter(Boolean).join(', ');
    const takeawayGroups = service.assignedGroups.takeaway.map(id => viewModel.practiceGroups.find(g => g.id === id)?.name).filter(Boolean).join(', ');

    const maxElaborations = Math.max(service.elaborations.comedor.length, service.elaborations.takeaway.length);
    for (let i = 0; i < maxElaborations; i++) {
        const comedorElab = service.elaborations.comedor[i];
        const takeawayElab = service.elaborations.takeaway[i];
        const comedorElabText = comedorElab ? `${comedorElab.name} (G: ${viewModel.practiceGroups.find(g => g.id === comedorElab.responsibleGroupId)?.name || 'N/A'})` : '';
        const takeawayElabText = takeawayElab ? `${takeawayElab.name} (G: ${viewModel.practiceGroups.find(g => g.id === takeawayElab.responsibleGroupId)?.name || 'N/A'})` : '';
        elaborationsBody.push([comedorElabText, takeawayElabText]);
    }

    autoTable(doc, {
        startY: lastY,
        head: [['COMEDOR', 'TAKEAWAY']],
        body: [[{content: `Grupos: ${comedorGroups || 'Ninguno'}`, styles: {fontStyle: 'bold'}}, {content: `Grupos: ${takeawayGroups || 'Ninguno'}`, styles: {fontStyle: 'bold'}}]],
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        didDrawPage: didDrawPage
    });
    
    autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY,
        head: [['Elaboraciones Comedor', 'Elaboraciones Takeaway']],
        body: elaborationsBody.length > 0 ? elaborationsBody : [['-', '-']],
        theme: 'striped',
        didDrawPage: didDrawPage
    });

    lastY = (doc as any).lastAutoTable.finalY + 10;
    
    // Student Roles
    const studentRolesBody = viewModel.participatingStudents.map(student => {
        const assignment = service.studentRoles.find(sr => sr.studentId === student.id);
        const role = assignment ? serviceRoles.find(r => r.id === assignment.roleId) : null;
        const group = viewModel.practiceGroups.find(pg => pg.studentIds.includes(student.id));
        return [`${student.apellido1} ${student.apellido2}, ${student.nombre}`, group?.name || 'N/A', role?.name || 'Sin asignar'];
    });
    
    autoTable(doc, {
        startY: lastY,
        head: [['Alumno', 'Grupo', 'Puesto Asignado']],
        body: studentRolesBody,
        theme: 'striped',
        headStyles: { fillColor: [34, 139, 34] },
        didDrawPage: didDrawPage
    });

    doc.save(`Planning_${service.name.replace(/ /g, '_')}.pdf`);
};

export const generateTrackingSheetPDF = (viewModel: ReportViewModel) => {
    const { service, evaluation, groupedStudentsInService } = viewModel;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let lastY = 40;

    const preServiceDateKey = Object.keys(evaluation.preService).sort((a,b) => new Date(b).getTime() - new Date(a).getTime())[0];
    if (!preServiceDateKey) {
        alert("No hay datos de pre-servicio para generar este informe.");
        return;
    }
    const preServiceDay = evaluation.preService[preServiceDateKey];
    const preServiceDate = new Date(preServiceDateKey + 'T12:00:00Z');
    const title = `Ficha de Seguimiento - Semana del ${preServiceDate.toLocaleDateString('es-ES')}`;

    const didDrawPage = getPageHeaderFooterCallback(viewModel, title);
    
    groupedStudentsInService.forEach((groupData, index) => {
        if(groupData.students.length === 0) return;

        const head = [
            ['Criterio', ...groupData.students.map(s => `${s.apellido1} ${s.nombre.charAt(0)}.`)]
        ];

        const body = [];
        const getCheck = (checked: boolean) => checked ? 'X' : '';

        const indEvals = preServiceDay.individualEvaluations;

        body.push(['Asistencia', ...groupData.students.map(s => getCheck(indEvals[s.id]?.attendance ?? true))]);
        body.push(['Fichas', ...groupData.students.map(s => getCheck(indEvals[s.id]?.hasFichas ?? true))]);
        body.push(['Uniforme', ...groupData.students.map(s => getCheck(indEvals[s.id]?.hasUniforme ?? true))]);
        body.push(['Material', ...groupData.students.map(s => getCheck(indEvals[s.id]?.hasMaterial ?? true))]);
        
        const symbolMap: Record<number, string> = { 2: '++', 1: '+', 0: '-' };
        PRE_SERVICE_BEHAVIOR_ITEMS.forEach(item => {
            body.push([item.label, ...groupData.students.map(s => {
                const score = indEvals[s.id]?.behaviorScores[item.id];
                return score !== null && score !== undefined ? symbolMap[score] : '';
            })]);
        });
        body.push(['Observaciones', ...groupData.students.map(s => indEvals[s.id]?.observations || '')]);
        
        if (index > 0) {
            doc.addPage();
            lastY = 40;
        }
        
        autoTable(doc, {
            startY: lastY,
            head: [[{ content: `Grupo: ${groupData.group.name}`, colSpan: groupData.students.length + 1, styles: { halign: 'center', fillColor: [220, 220, 220], textColor: 0 } }]],
            didDrawPage
        });
        
        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] },
            didDrawPage,
            styles: {
                fontSize: 8,
                cellPadding: 1.5,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 60 }
            }
        });
        lastY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`Ficha_Seguimiento_${service.name.replace(/ /g, '_')}.pdf`);
};
