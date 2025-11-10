import { ReportViewModel } from '../types';
import { downloadPdfWithTables } from '../components/printUtils';
import { INDIVIDUAL_EVALUATION_ITEMS, GROUP_EVALUATION_ITEMS } from '../data/constants';

export const generateServiceSheet = (viewModel: ReportViewModel) => {
    const { service, teacherData, instituteData, serviceRoles, groupedStudentsInService, practiceGroups } = viewModel;
    const title = `Ficha de Servicio: ${service.name} (${new Date(service.date).toLocaleDateString('es-ES')})`;
    const headers: any[] = [];
    const bodies: any[] = [];

    if (service.elaborations.comedor.length > 0) {
        headers.push([["Elaboraciones Comedor", "Grupo Responsable"]]);
        bodies.push(service.elaborations.comedor.map(e => [
            e.name,
            practiceGroups.find(g => g.id === e.responsibleGroupId)?.name || 'N/A'
        ]));
    }
    
    if (service.elaborations.takeaway.length > 0) {
        headers.push([["Elaboraciones Take Away", "Grupo Responsable"]]);
        bodies.push(service.elaborations.takeaway.map(e => [
            e.name,
            practiceGroups.find(g => g.id === e.responsibleGroupId)?.name || 'N/A'
        ]));
    }

    if(groupedStudentsInService.length > 0) {
        headers.push([["Alumno", "Grupo", "Puesto Asignado"]]);
        bodies.push(groupedStudentsInService.flatMap(({ group, students }) =>
            students.map(student => {
                const roleId = service.studentRoles.find(sr => sr.studentId === student.id)?.roleId;
                const roleName = serviceRoles.find(r => r.id === roleId)?.name || 'Sin asignar';
                return [`${student.apellido1} ${student.apellido2}, ${student.nombre}`, group.name, roleName];
            })
        ));
    }

    downloadPdfWithTables(title, headers, bodies, teacherData, instituteData);
};

export const generateEvaluationReport = (viewModel: ReportViewModel) => {
    const { service, evaluation, teacherData, instituteData, groupedStudentsInService } = viewModel;

    const title = `Informe de Evaluación: ${service.name}`;
    const headers: any[] = [];
    const bodies: any[] = [];
    const participatingGroups = groupedStudentsInService.map(item => item.group);

    // Group Evaluation Table
    if (participatingGroups.length > 0) {
        const groupHead = [["Criterio de Grupo", ...participatingGroups.map(g => g.name)]];
        const groupBody = GROUP_EVALUATION_ITEMS.map((item, index) => {
            return [
                `${item.label} (${item.maxScore.toFixed(2)} pts)`,
                ...participatingGroups.map(g => {
                    const score = evaluation.serviceDay.groupScores[g.id]?.scores[index];
                    return score !== null && score !== undefined ? score.toFixed(2) : '-';
                })
            ];
        });
        const groupTotals = ['TOTAL', ...participatingGroups.map(g => {
            const scores = evaluation.serviceDay.groupScores[g.id]?.scores;
            return scores ? scores.reduce((acc, s) => acc + (s || 0), 0).toFixed(2) : '0.00';
        })];
        groupBody.push(groupTotals);
        headers.push(groupHead);
        bodies.push(groupBody);
    }
    
    // Individual Evaluation Table
    if (viewModel.participatingStudents.length > 0) {
        const individualHead = [["Criterio Individual", ...viewModel.participatingStudents.map(s => `${s.apellido1} ${s.nombre.charAt(0)}.`)]];
        const individualBody = INDIVIDUAL_EVALUATION_ITEMS.map((item, index) => {
             return [
                `${item.label} (${item.maxScore.toFixed(2)} pts)`,
                ...viewModel.participatingStudents.map(s => {
                    const score = evaluation.serviceDay.individualScores[s.id]?.scores[index];
                    return score !== null && score !== undefined ? score.toFixed(2) : '-';
                })
            ];
        });
         const individualTotals = ['TOTAL', ...viewModel.participatingStudents.map(s => {
            const scores = evaluation.serviceDay.individualScores[s.id]?.scores;
            return scores ? scores.reduce((acc, s) => acc + (s || 0), 0).toFixed(2) : '0.00';
        })];
        individualBody.push(individualTotals);
        headers.push(individualHead);
        bodies.push(individualBody);
    }
    
    downloadPdfWithTables(title, headers, bodies, teacherData, instituteData);
};
