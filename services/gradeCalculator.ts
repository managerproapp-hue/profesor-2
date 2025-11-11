import { StudentAcademicGrades, StudentCalculatedGrades } from '../types';
import { ACADEMIC_EVALUATION_STRUCTURE } from '../data/constants';

export const calculateStudentPeriodAverages = (
    academicGrades: StudentAcademicGrades | undefined,
    calculatedGrades: StudentCalculatedGrades | undefined
): Record<string, number | null> => {
    const results: { [periodKey: string]: number | null } = {};

    if (!calculatedGrades) {
        ACADEMIC_EVALUATION_STRUCTURE.periods.forEach(period => {
            results[period.key] = null;
        });
        return results;
    }

    ACADEMIC_EVALUATION_STRUCTURE.periods.forEach(period => {
        let totalWeight = 0;
        let weightedSum = 0;
        period.instruments.forEach(instrument => {
            let grade: number | null = null;
            if (instrument.type === 'manual') {
                const manualGrade = academicGrades?.[period.key]?.manualGrades?.[instrument.key];
                grade = (manualGrade === null || manualGrade === undefined) ? null : parseFloat(String(manualGrade));
            } else { // calculated
                if (instrument.key === 'servicios') {
                    const periodKey = period.key as 't1' | 't2' | 't3';
                    grade = calculatedGrades.serviceAverages[periodKey] ?? null;
                } else {
                    const examKeyMap: Record<string, keyof StudentCalculatedGrades['practicalExams']> = {
                        'exPracticoT1': 't1', 'exPracticoT2': 't2', 'exPracticoT3': 't3', 'exPracticoRec': 'rec',
                    };
                    const examKey = examKeyMap[instrument.key];
                    if (examKey) {
                        grade = calculatedGrades.practicalExams[examKey] ?? null;
                    }
                }
            }
            if (grade !== null && !isNaN(grade)) {
                weightedSum += grade * instrument.weight;
                totalWeight += instrument.weight;
            }
        });
        results[period.key] = totalWeight > 0 ? parseFloat((weightedSum / totalWeight).toFixed(2)) : null;
    });

    return results;
};