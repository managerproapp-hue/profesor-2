import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportViewModel, Student, ServiceRole } from '../types';

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
        didDrawPage
    });
    
    lastY = (doc as any).lastAutoTable.finalY + 8;

    const drawServiceSection = (area: 'comedor' | 'takeaway') => {
        if ((doc as any).lastAutoTable.finalY > 250) doc.addPage();
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

            autoTable(doc, {
                startY: lastY,
                body: [
                    [{ content: `Grupo ${groupData.group.name}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [245, 245, 245] } }],
                    [{ content: elaborationsText, colSpan: 2, styles: { minCellHeight: 10 } }],
                    ...studentRolesBody
                ],
                theme: 'grid',
                columnStyles: { 1: { halign: 'right' } },
                didDrawPage
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
        doc.text(new Date(service.date).toLocaleDateString('es-ES'), pageWidth / 2, 21, { align: 'center' });
        
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
        
        // Column Titles
        doc.setFontSize(10).setFont('helvetica', 'bold');
        doc.text('DÍA PREVIO', col1X, y);
        doc.text('DÍA DE SERVICIO', col2X, y);
        y += 5;

        // Checklists
        doc.setFontSize(9).setFont('helvetica', 'normal');
        const checklist = [
            'Asistencia: Sí [ ] No [X]', 'Uniforme completo: [ ]', 'Fichas técnicas: [ ]', 'Material requerido: [ ]'
        ];
        checklist.forEach((item, index) => {
            doc.text(item, col1X, y + (index * 5));
            doc.text(item, col2X, y + (index * 5));
        });
        y += checklist.length * 5 + 2;

        // Observation Boxes
        doc.setDrawColor(180);
        doc.rect(col1X, y, colWidth, 25);
        doc.rect(col2X, y, colWidth, 25);
    };

    let isFirstGroup = true;
    groupedStudentsInService.forEach(groupData => {
        if (groupData.students.length === 0) return;

        if (!isFirstGroup) {
            doc.addPage();
        }
        isFirstGroup = false;

        let currentPage = doc.internal.getCurrentPageInfo().pageNumber;
        const groupType = service.assignedGroups.comedor.includes(groupData.group.id) ? 'COMEDOR' : 'TAKEAWAY';
        const groupTitle = `Grupo ${groupData.group.name} - ${groupType}`;

        drawHeader(groupTitle, false);
        let currentY = 40;

        doc.setFontSize(10).setFont('helvetica', 'normal');
        doc.text('Observaciones Generales del Grupo:', PAGE_MARGIN, currentY);
        doc.setDrawColor(180);
        doc.rect(PAGE_MARGIN, currentY + 2, contentWidth, 15);
        currentY += 23;

        groupData.students.forEach(student => {
            if (currentY + STUDENT_BLOCK_HEIGHT > pageHeight - 15) { // Check for page break
                drawFooter(currentPage);
                doc.addPage();
                currentPage++;
                currentY = 35;
                drawHeader(groupTitle, true);
            }
            const role = serviceRoles.find(r => r.id === service.studentRoles.find(sr => sr.studentId === student.id)?.roleId);
            drawStudentBlock(student, role, currentY);
            currentY += STUDENT_BLOCK_HEIGHT;
        });

        drawFooter(currentPage);
    });

    doc.save(`Ficha_Seguimiento_${service.name.replace(/ /g, '_')}.pdf`);
};
