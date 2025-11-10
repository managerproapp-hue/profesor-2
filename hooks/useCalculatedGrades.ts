import { useMemo } from 'react';
import { StudentCalculatedGrades } from '../types';
import { useAppContext } from '../context/AppContext';
import { SERVICE_GRADE_WEIGHTS } from '../data/constants';

export const useCalculatedGrades = (): Record<string, StudentCalculatedGrades> => {
    const { students, practicalExamEvaluations, serviceEvaluations, practiceGroups } = useAppContext();

    const calculatedStudentGrades = useMemo((): Record<string, StudentCalculatedGrades> => {
        const studentGrades: Record<string, StudentCalculatedGrades> = {};

        students.forEach(student => {
            // Practical Exams
            const t1Exam = practicalExamEvaluations.find(e => e.studentId === student.id && e.examPeriod === 't1');
            const t2Exam = practicalExamEvaluations.find(e => e.studentId === student.id && e.examPeriod === 't2');
            const recExam = practicalExamEvaluations.find(e => e.studentId === student.id && e.examPeriod === 'rec');

            // Service Evaluations
            const serviceGrades: number[] = [];
            serviceEvaluations.forEach(evaluation => {
                const individualEval = evaluation.serviceDay.individualScores[student.id];
                if (individualEval && individualEval.attendance) {
                    const individualScore = (individualEval.scores || []).reduce((sum, score) => sum + (score || 0), 0);
                    
                    const studentPracticeGroup = practiceGroups.find(pg => pg.studentIds.includes(student.id));
                    let groupScore = 0;
                    if (studentPracticeGroup) {
                        const groupEval = evaluation.serviceDay.groupScores[studentPracticeGroup.id];
                        if (groupEval) {
                            groupScore = (groupEval.scores || []).reduce((sum, score) => sum + (score || 0), 0);
                        }
                    }
                    
                    const weightedServiceGrade = (individualScore * SERVICE_GRADE_WEIGHTS.individual) + (groupScore * SERVICE_GRADE_WEIGHTS.group);
                    serviceGrades.push(weightedServiceGrade);
                }
            });
            
            const serviceAverage = serviceGrades.length > 0
                ? serviceGrades.reduce((sum, grade) => sum + grade, 0) / serviceGrades.length
                : null;
            
            studentGrades[student.id] = {
                serviceAverage,
                practicalExams: {
                    t1: t1Exam?.finalScore ?? null,
                    t2: t2Exam?.finalScore ?? null,
                    rec: recExam?.finalScore ?? null,
                }
            };
        });

        return studentGrades;
    }, [students, serviceEvaluations, practicalExamEvaluations, practiceGroups]);
    
    return calculatedStudentGrades;
};
