import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportViewModel, Student, ServiceRole, TeacherData, InstituteData } from '../types';
import { PRE_SERVICE_BEHAVIOR_ITEMS, BEHAVIOR_RATING_MAP, INDIVIDUAL_EVALUATION_ITEMS, GROUP_EVALUATION_ITEMS } from '../data/constants';

// --- Reusable PDF Generation Helpers ---

const addImageToPdf = (doc: jsPDF, imageData: string | null, x: number, y: number, w: number, h: number) => {
    if (imageData && imageData.startsWith('data:image')) {
        try {
            const imageType = imageData.substring(imageData.indexOf('/') + 1, imageData.indexOf(';'));
            doc.addImage(imageData, imageType.toUpperCase(), x, y, w, h);
        } catch (e) { console.error("Error adding image:", e); }
    }
};

const PAGE_MARGIN = 15;

// --- Planning PDF ---

export const generatePlanningPDF = (viewModel: ReportViewModel) => {
    const { service, serviceRoles, groupedStudentsInService, participatingStudents, teacherData, instituteData } = viewModel;
    const doc = new jsPDF('p', 'mm', 'a4');
    let lastY = 0;

    const didDrawPage = (data: any) => {
        const doc = data.doc;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        // HEADER
        addImageToPdf(doc, instituteData.logo, PAGE_MARGIN, 10, 15, 15);
        addImageToPdf(doc, teacherData.logo, pageWidth - PAGE_MARGIN - 15, 10, 15, 15);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40);
        doc.text(`Planning: ${service.name}`, pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Comienzo curso (${new Date(service.date).toLocaleDateString('es-ES')})`, pageWidth / 2, 24, { align: 'center' });
        
        // FOOTER
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`${instituteData.name} - ${teacherData.name}`, PAGE_MARGIN, pageHeight - 10);
        doc.text(`Página ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        const date = new Date().toLocaleDateString('es-ES');
        doc.text(date, pageWidth - PAGE_MARGIN, pageHeight - 10, { align: 'right' });
    };

    const leaders = participatingStudents.map(student => {
        const assignment = service.studentRoles.find(sr => sr.studentId === student.id);
        const role = assignment ? serviceRoles.find(r => r.id === assignment.roleId) : null;
        return { student, role };
    }).filter(item => item.role && item.role.type === 'leader').sort((a,b) => a.role!.name.localeCompare(b.role!.name));

    const leadersBody = leaders.map(l => [
        { content: l.role?.name, styles: { fontStyle: 'bold' } }, 
        `${l.student.nombre} ${l.student.apellido1} ${l.student.apellido2}`
    ]);

    autoTable(doc, {
        startY: 32,
        head: [['Líderes del Servicio']],
        body: leadersBody,
        theme: 'striped',
        headStyles: { fillColor: [220, 220, 220], textColor: 40, fontStyle: 'bold' },
        didDrawPage,
        margin: { top: 35 }
    });
    
    lastY = (doc as any).lastAutoTable.finalY + 8;

    const drawServiceSection = (area: 'comedor' | 'takeaway') => {
        const pageHeight = doc.internal.pageSize.getHeight();
        if (lastY > pageHeight - 40) { // Check if there's enough space for the section header
             doc.addPage();
             lastY = 35; // Reset Y position on new page
        }
       
        autoTable(doc, {
            startY: lastY,
            body: [[`SERVICIO DE ${area.toUpperCase()}`]],
            theme: 'plain',
            styles: { minCellHeight: 8, valign: 'middle', halign: 'center', fillColor: [230, 240, 230], fontStyle: 'bold', textColor: 40 }
        });
        lastY = (doc as any).lastAutoTable.finalY;

        const groupsInArea = groupedStudentsInService.filter(g => service.assignedGroups[area].includes(g.group.id));

        groupsInArea.forEach(groupData => {
            const elaborations = service.elaborations[area].filter(e => e.responsibleGroupId === groupData.group.id);
            const elaborationsText = 'Elaboraciones:\n' + (elaborations.map(e => `- ${e.name}`).join('\n'));

            const studentRolesBody = groupData.students.map(student => {
                 const assignment = service.studentRoles.find(sr => sr.studentId === student.id);
                 const role = assignment ? serviceRoles.find(r => r.id === assignment.roleId) : null;
                 return [`${student.apellido1} ${student.apellido2}, ${student.nombre}`, role?.name || ''];
            });
            
            // Check if there is enough space for the next block, if not, add a new page.
            const minBlockHeight = 40; // Estimate for header + elaborations + one student row + padding
            const pageBottomMargin = 20; // Space for footer
            
            if (lastY > pageHeight - pageBottomMargin - minBlockHeight) {
                doc.addPage();
                lastY = 35; // Corresponds to margin.top in autoTable options
            }

            autoTable(doc, {
                startY: lastY,
                body: [
                    [{ content: `Grupo ${groupData.group.name}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }],
                    [{ content: elaborationsText, colSpan: 2, styles: { minCellHeight: 10, whiteSpace: 'pre-wrap' } }],
                    ...studentRolesBody
                ],
                theme: 'grid',
                columnStyles: { 1: { halign: 'right' } },
                didDrawPage,
                margin: { top: 35 }
            });
            lastY = (doc as any).lastAutoTable.finalY;
        });
        lastY += 8;
    };
    
    drawServiceSection('comedor');
    drawServiceSection('takeaway');

    doc.save(`Planning_${service.name.replace(/ /g, '_')}.pdf`);
};

// --- Tracking Sheet PDF ---

export const generateTrackingSheetPDF = (viewModel: ReportViewModel) => {
    const { service, groupedStudentsInService, teacherData, instituteData, serviceRoles } = viewModel;
    const doc = new jsPDF('p', 'mm', 'a4');
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const contentWidth = pageWidth - PAGE_MARGIN * 2;
    const STUDENT_BLOCK_HEIGHT = 73;

    const drawHeader = (groupTitle: string, isContinuation: boolean) => {
        addImageToPdf(doc, instituteData.logo, PAGE_MARGIN, 10, 15, 15);
        addImageToPdf(doc, teacherData.logo, pageWidth - PAGE_MARGIN - 15, 10, 15, 15);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40);
        doc.text(`Ficha de Seguimiento: ${service.name}`, pageWidth / 2, 16, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(new Date(service.date + 'T12:00:00Z').toLocaleDateString('es-ES'), pageWidth / 2, 21, { align: 'center' });
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(groupTitle + (isContinuation ? ' (cont.)' : ''), PAGE_MARGIN, 32);
    };

    const drawFooter = (pageNum: number) => {
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`${instituteData.name} - ${teacherData.name}`, PAGE_MARGIN, pageHeight - 10);
        doc.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        const date = new Date().toLocaleDateString('es-ES');
        doc.text(date, pageWidth - PAGE_MARGIN, pageHeight - 10, { align: 'right' });
    };

    const drawStudentBlock = (student: Student, role: ServiceRole | null | undefined, y: number) => {
        doc.setDrawColor(150);
        doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y); // Top separator
        y += 5;

        // Student Info
        doc.setFontSize(12).setFont('helvetica', 'bold').setTextColor(0);
        doc.text(`${student.apellido1} ${student.apellido2}, ${student.nombre}`.toUpperCase(), PAGE_MARGIN, y);
        doc.setFontSize(11).setFont('helvetica', 'normal');
        doc.text(role?.name || '', pageWidth - PAGE_MARGIN, y, { align: 'right' });
        y += 8;

        const col1X = PAGE_MARGIN;
        const col2X = pageWidth / 2 + 5;
        const colWidth = contentWidth / 2 - 5;
        
        doc.setFontSize(10).setFont('helvetica', 'bold');
        doc.text('DÍA PREVIO', col1X, y);
        doc.text('DÍA DE SERVICIO', col2X, y);
        y += 5;

        doc.setFontSize(9).setFont('helvetica', 'normal');
        const checklist = [
            'Asistencia: Sí [ ] No [X]', 'Uniforme completo: [ ]', 'Fichas técnicas: [ ]', 'Material requerido: [ ]'
        ];
        checklist.forEach((item, index) => {
            doc.text(item, col1X, y + (index * 5));
            doc.text(item, col2X, y + (index * 5));
        });
        y += checklist.length * 5 + 2;

        doc.setDrawColor(180);
        doc.rect(col1X, y, colWidth, 25);
        doc.rect(col2X, y, colWidth, 25);
    };

    let pageCounter = 1;
    groupedStudentsInService.forEach((groupData, groupIndex) => {
        if (groupData.students.length === 0) return;

        if (groupIndex > 0) {
            pageCounter++;
            doc.addPage();
        }

        const groupType = service.assignedGroups.comedor.includes(groupData.group.id) ? 'COMEDOR' : 'TAKEAWAY';
        const groupTitle = `Grupo ${groupData.group.name} - ${groupType}`;

        drawHeader(groupTitle, false);
        let currentY = 40;

        doc.setFontSize(10).setFont('helvetica', 'normal');
        doc.text('Observaciones Generales del Grupo:', PAGE_MARGIN, currentY);
        doc.setDrawColor(180);
        doc.rect(PAGE_MARGIN, currentY + 2, contentWidth, 15);
        currentY += 23;

        groupData.students.forEach((student, studentIndex) => {
            if (currentY + STUDENT_BLOCK_HEIGHT > pageHeight - 15) { 
                drawFooter(pageCounter);
                pageCounter++;
                doc.addPage();
                currentY = 35;
                drawHeader(groupTitle, true);
            }
            const role = serviceRoles.find(r => r.id === service.studentRoles.find(sr => sr.studentId === student.id)?.roleId);
            drawStudentBlock(student, role, currentY);
            currentY += STUDENT_BLOCK_HEIGHT;
        });
        drawFooter(pageCounter);
    });

    doc.save(`Ficha_Seguimiento_${service.name.replace(/ /g, '_')}.pdf`);
};

// --- Full Evaluation Report PDF ---
export const generateFullEvaluationReportPDF = (viewModel: ReportViewModel) => {
    const { service, evaluation, groupedStudentsInService, teacherData, instituteData } = viewModel;
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const didDrawPage = (data: any) => {
        const doc = data.doc;
        const pageHeight = doc.internal.pageSize.getHeight();

        addImageToPdf(doc, instituteData.logo, PAGE_MARGIN, 10, 15, 15);
        addImageToPdf(doc, teacherData.logo, pageWidth - PAGE_MARGIN - 15, 10, 15, 15);
        
        doc.setFontSize(14).setFont('helvetica', 'bold').setTextColor(40);
        doc.text(`Ficha de Evaluación: ${service.name}`, pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(100);
        doc.text(`Fecha del servicio: ${new Date(service.date).toLocaleDateString('es-ES')}`, pageWidth / 2, 24, { align: 'center' });
        
        doc.setFontSize(8).setTextColor(120);
        doc.text(`${instituteData.name} - ${teacherData.name}`, PAGE_MARGIN, pageHeight - 10);
        doc.text(`Página ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(new Date().toLocaleDateString('es-ES'), pageWidth - PAGE_MARGIN, pageHeight - 10, { align: 'right' });
    };

    // Part 1: Group Evaluation Table
    const participatingGroups = groupedStudentsInService.map(g => g.group);
    const groupEvalHead = [['Criterio de Evaluación Grupal', ...participatingGroups.map(g => g.name)]];
    const groupEvalBody = [];
    
    GROUP_EVALUATION_ITEMS.forEach((item, index) => {
        const row = [item.label];
        participatingGroups.forEach(group => {
            const score = evaluation.serviceDay.groupScores[group.id]?.scores[index];
            row.push(score !== null && score !== undefined ? `${score.toFixed(2)} / ${item.maxScore.toFixed(2)}` : '-');
        });
        groupEvalBody.push(row);
    });

    const groupTotals = participatingGroups.map(group => {
        const scores = evaluation.serviceDay.groupScores[group.id]?.scores;
        return scores ? scores.reduce((sum, s) => sum + (s || 0), 0) : 0;
    });

    groupEvalBody.push([
        { content: 'TOTAL', styles: { fontStyle: 'bold' } },
        ...groupTotals.map(total => ({ content: `${total.toFixed(2)} / 10.00`, styles: { fontStyle: 'bold' } }))
    ]);
    
    groupEvalBody.push([
        { content: 'Observaciones', styles: { fontStyle: 'bold' } },
        ...participatingGroups.map(group => evaluation.serviceDay.groupScores[group.id]?.observations || '')
    ]);

    autoTable(doc, {
        head: groupEvalHead,
        body: groupEvalBody,
        startY: 32,
        margin: { top: 30, left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 20 },
        headStyles: { fillColor: [56, 161, 105] },
        didDrawPage,
    });

    // Part 2: Individual Evaluation Tables (one per group, on new pages)
    const preServiceDate = Object.keys(evaluation.preService)[0] || null;

    groupedStudentsInService.forEach(groupData => {
        doc.addPage();
        const studentsInGroup = groupData.students;
        const studentHeaders = studentsInGroup.map(s => `${s.apellido1} ${s.nombre.charAt(0)}.`);
        const individualEvalHead = [['Criterio de Evaluación Individual', ...studentHeaders]];
        const individualEvalBody = [];

        // Pre-Service Section
        individualEvalBody.push([{ content: `DÍA PREVIO (${preServiceDate ? new Date(preServiceDate).toLocaleDateString('es-ES') : 'N/A'})`, colSpan: studentsInGroup.length + 1, styles: { fillColor: [220, 220, 220], fontStyle: 'bold', textColor: 40 } }]);
        const preServiceChecks = ['attendance', 'hasFichas', 'hasUniforme', 'hasMaterial'];
        const preServiceLabels: Record<string, string> = { attendance: 'Asistencia', hasFichas: 'Fichas', hasUniforme: 'Uniforme', hasMaterial: 'Material' };

        preServiceChecks.forEach(check => {
            const row = [preServiceLabels[check]];
            studentsInGroup.forEach(s => {
                const isChecked = preServiceDate ? (evaluation.preService[preServiceDate]?.individualEvaluations[s.id]?.[check as keyof typeof evaluation.preService[string]['individualEvaluations'][string]] ?? (check === 'attendance')) : false;
                row.push(isChecked ? '✔' : '✘');
            });
            individualEvalBody.push(row);
        });

        PRE_SERVICE_BEHAVIOR_ITEMS.forEach(item => {
            const row = [item.label];
            studentsInGroup.forEach(s => {
                const score = preServiceDate ? evaluation.preService[preServiceDate]?.individualEvaluations[s.id]?.behaviorScores[item.id] : null;
                const rating = BEHAVIOR_RATING_MAP.find(r => r.value === score);
                row.push(rating ? rating.symbol : '-');
            });
            individualEvalBody.push(row);
        });

        // Service-Day Section
        individualEvalBody.push([{ content: 'DÍA DE SERVICIO', colSpan: studentsInGroup.length + 1, styles: { fillColor: [220, 220, 220], fontStyle: 'bold', textColor: 40 } }]);
        INDIVIDUAL_EVALUATION_ITEMS.forEach((item, index) => {
            const row = [item.label];
            studentsInGroup.forEach(s => {
                const score = evaluation.serviceDay.individualScores[s.id]?.scores[index];
                row.push(score !== null && score !== undefined ? `${score.toFixed(2)} / ${item.maxScore.toFixed(2)}` : '-');
            });
            individualEvalBody.push(row);
        });

        const individualTotals = studentsInGroup.map(s => {
            const scores = evaluation.serviceDay.individualScores[s.id]?.scores;
            return scores ? scores.reduce((sum, score) => sum + (score || 0), 0) : 0;
        });

        individualEvalBody.push([
            { content: 'TOTAL DÍA SERVICIO', styles: { fontStyle: 'bold' } },
            ...individualTotals.map(total => ({ content: `${total.toFixed(2)} / 10.00`, styles: { fontStyle: 'bold' } }))
        ]);

        individualEvalBody.push([
            { content: 'Observaciones', styles: { fontStyle: 'bold' } },
            ...studentsInGroup.map(s => evaluation.serviceDay.individualScores[s.id]?.observations || '')
        ]);
        
        autoTable(doc, {
            head: [[{ content: `Grupo ${groupData.group.name}`, colSpan: studentsInGroup.length + 1, styles: { halign: 'center', fillColor: [49, 130, 206], fontStyle: 'bold' } }]],
            body: [],
            startY: 32,
            margin: { top: 30, left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 20 },
            didDrawPage,
        });

        autoTable(doc, {
            head: individualEvalHead,
            body: individualEvalBody,
            startY: (doc as any).lastAutoTable.finalY,
            margin: { top: 30, left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 20 },
            headStyles: { fillColor: [74, 85, 104] },
            didDrawPage,
        });
    });


    doc.save(`Evaluacion_${service.name.replace(/ /g, '_')}.pdf`);
};


// --- Detailed Student Service Report PDF (Internal Helper) ---
const _drawDetailedStudentReportPage = (doc: jsPDF, viewModel: ReportViewModel, studentId: string) => {
    const { service, evaluation, students, practiceGroups, serviceRoles, teacherData, instituteData, entryExitRecords } = viewModel;
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    let lastY = 0;

    const didDrawPage = (data: any) => {
        const doc = data.doc;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        addImageToPdf(doc, instituteData.logo, PAGE_MARGIN, 10, 15, 15);
        doc.setFontSize(12).setFont('helvetica', 'bold').setTextColor(40);
        doc.text(service.name, pageWidth / 2, 16, { align: 'center' });
        doc.setFontSize(10).setFont('helvetica', 'normal').setTextColor(100);
        doc.text(new Date(service.date + 'T12:00:00Z').toLocaleDateString('es-ES'), pageWidth / 2, 21, { align: 'center' });

        doc.setFontSize(8).setTextColor(120);
        doc.text(`${instituteData.name} - ${teacherData.name}`, PAGE_MARGIN, pageHeight - 10);
        doc.text(`Página ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(new Date().toLocaleDateString('es-ES'), pageWidth - PAGE_MARGIN, pageHeight - 10, { align: 'right' });
    };
    
    const studentGroup = practiceGroups.find(g => g.studentIds.includes(student.id));
    const summaryBody = [
        ['Servicio:', service.name],
        ['Fecha:', new Date(service.date + 'T12:00:00Z').toLocaleDateString('es-ES')],
        ['Alumno:', `${student.apellido1} ${student.apellido2}, ${student.nombre}`],
        ['Grupo:', studentGroup ? studentGroup.name : 'No asignado'],
    ];

    autoTable(doc, {
        startY: 30,
        head: [['Resumen del Servicio']],
        body: summaryBody,
        theme: 'striped',
        headStyles: { fillColor: [74, 85, 104] },
        didDrawPage,
    });
    lastY = (doc as any).lastAutoTable.finalY;
    
    const preServiceDate = Object.keys(evaluation.preService)[0] || null;
    const preServiceEval = preServiceDate ? evaluation.preService[preServiceDate]?.individualEvaluations[student.id] : null;
    const preServiceBody = [];
    if (preServiceEval) {
        preServiceBody.push(['Asistencia', preServiceEval.attendance ? 'Presente' : 'Ausente']);
        preServiceBody.push(['Fichas Técnicas', preServiceEval.hasFichas ? 'Sí' : 'No']);
        preServiceBody.push(['Uniforme', preServiceEval.hasUniforme ? 'Sí' : 'No']);
        preServiceBody.push(['Material', preServiceEval.hasMaterial ? 'Sí' : 'No']);
        PRE_SERVICE_BEHAVIOR_ITEMS.forEach(item => {
            const score = preServiceEval.behaviorScores[item.id];
            const rating = BEHAVIOR_RATING_MAP.find(r => r.value === score);
            preServiceBody.push([item.label, rating ? `${rating.label} (${rating.symbol})` : '-']);
        });
        if (preServiceEval.observations) preServiceBody.push([{ content: 'Observaciones (Día Previo):', styles: { fontStyle: 'bold' } }, preServiceEval.observations]);
    } else {
        preServiceBody.push(['- No hay datos de pre-servicio para este alumno -']);
    }

    autoTable(doc, { startY: lastY + 8, head: [['Evaluación Individual - Día Previo']], body: preServiceBody, theme: 'grid', headStyles: { fillColor: [49, 130, 206] }, didDrawPage, });
    lastY = (doc as any).lastAutoTable.finalY;

    const serviceDayEval = evaluation.serviceDay.individualScores[student.id];
    const serviceDayBody = [];
    if (serviceDayEval) {
        serviceDayBody.push(['Asistencia', serviceDayEval.attendance ? 'Presente' : 'Ausente']);
        if (serviceDayEval.attendance) INDIVIDUAL_EVALUATION_ITEMS.forEach((item, index) => serviceDayBody.push([item.label, `${serviceDayEval.scores[index]?.toFixed(2) ?? '-'} / ${item.maxScore.toFixed(2)}`]));
        if (serviceDayEval.observations) serviceDayBody.push([{ content: 'Observaciones (Día de Servicio):', styles: { fontStyle: 'bold' } }, serviceDayEval.observations]);
    } else {
        serviceDayBody.push(['- No hay datos de día de servicio para este alumno -']);
    }

    autoTable(doc, { startY: lastY + 8, head: [['Evaluación Individual - Día de Servicio']], body: serviceDayBody, theme: 'grid', headStyles: { fillColor: [49, 130, 206] }, didDrawPage, });
    lastY = (doc as any).lastAutoTable.finalY;

    if(studentGroup) {
        const groupEval = evaluation.serviceDay.groupScores[studentGroup.id];
        const groupBody = [];
        if (groupEval) {
            GROUP_EVALUATION_ITEMS.forEach((item, index) => groupBody.push([item.label, `${groupEval.scores[index]?.toFixed(2) ?? '-'} / ${item.maxScore.toFixed(2)}`]));
            if (groupEval.observations) groupBody.push([{ content: 'Observaciones Grupales:', styles: { fontStyle: 'bold' } }, groupEval.observations]);
        } else {
            groupBody.push(['- No hay datos de evaluación para este grupo -']);
        }
        autoTable(doc, { startY: lastY + 8, head: [[`Evaluación Grupal (${studentGroup.name})`]], body: groupBody, theme: 'grid', headStyles: { fillColor: [56, 161, 105] }, didDrawPage, });
        lastY = (doc as any).lastAutoTable.finalY;
    }

    const getWeekMonday = (date: Date) => { const d = new Date(date); d.setHours(0, 0, 0, 0); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.setDate(diff)); };
    const serviceDate = new Date(service.date + 'T12:00:00Z');
    const weekStart = getWeekMonday(serviceDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const incidents = entryExitRecords.filter(rec => { if (rec.studentId !== studentId) return false; const [day, month, year] = rec.date.split('/'); const recDate = new Date(`${year}-${month}-${day}`); recDate.setHours(12,0,0,0); return recDate >= weekStart && recDate <= weekEnd; }).map(rec => [rec.date, rec.type, rec.reason]);
    
    if (incidents.length > 0) {
        autoTable(doc, { startY: lastY + 8, head: [['Incidencias Registradas (Semana del Servicio)']], body: incidents, theme: 'striped', headStyles: { fillColor: [221, 107, 32] }, didDrawPage, });
    }
};

export const generateDetailedStudentServiceReportPDF = (viewModel: ReportViewModel, studentId: string) => {
    const student = viewModel.students.find(s => s.id === studentId);
    if (!student) return;
    const doc = new jsPDF('p', 'mm', 'a4');
    _drawDetailedStudentReportPage(doc, viewModel, studentId);
    doc.save(`Informe_${viewModel.service.name.replace(/ /g, '_')}_${student.apellido1}.pdf`);
};

export const generateAllDetailedStudentReportsPDF = (viewModel: ReportViewModel) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    viewModel.participatingStudents.forEach((student, index) => {
        if (index > 0) {
            doc.addPage();
        }
        _drawDetailedStudentReportPage(doc, viewModel, student.id);
    });
    doc.save(`Informes_Alumnos_${viewModel.service.name.replace(/ /g, '_')}.pdf`);
};

export const generateEntryExitSheetPDF = (
    students: Student[],
    teacherData: TeacherData,
    instituteData: InstituteData
) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const didDrawPage = (data: any) => {
        addImageToPdf(doc, instituteData.logo, PAGE_MARGIN, 10, 15, 15);
        addImageToPdf(doc, teacherData.logo, pageWidth - PAGE_MARGIN - 15, 10, 15, 15);
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(40);
        doc.text('Hoja de Registro de Entradas y Salidas', pageWidth / 2, 18, { align: 'center' });
        
        doc.setFontSize(8);
        doc.setTextColor(120);
        doc.text(`${instituteData.name} - ${teacherData.name}`, PAGE_MARGIN, pageHeight - 10);
        doc.text(`Página ${data.pageNumber}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        const date = new Date().toLocaleDateString('es-ES');
        doc.text(date, pageWidth - PAGE_MARGIN, pageHeight - 10, { align: 'right' });
    };

    const head = [['#', 'Alumno', 'Fecha', 'Tipo (E/S)', 'Motivo / Observaciones']];
    const sortedStudents = [...students].sort((a, b) => a.apellido1.localeCompare(b.apellido1));

    const body = sortedStudents.map((student, index) => [
        index + 1,
        `${student.apellido1} ${student.apellido2}, ${student.nombre}`,
        '',
        '',
        '',
    ]);

    autoTable(doc, {
        head: head,
        body: body,
        startY: 32,
        margin: { top: 35, bottom: 20 },
        headStyles: { fillColor: [74, 85, 104], textColor: 255, fontStyle: 'bold' },
        didDrawPage,
        styles: {
            cellPadding: 3,
            minCellHeight: 12
        },
        columnStyles: {
            0: { cellWidth: 10 },
            1: { cellWidth: 50 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 'auto' },
        }
    });

    doc.save(`Hoja_Registro_Entradas_Salidas.pdf`);
};
