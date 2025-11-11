import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PracticalExamEvaluation, ExamPeriod } from '../types';
import { PRACTICAL_EXAM_RUBRIC, SCORE_LEVELS } from '../data/constants';
import { SearchIcon, SaveIcon } from '../components/icons';
import { useAppContext } from '../context/AppContext';

interface ExamenesPracticosViewProps {
    isFocusMode: boolean;
    setIsFocusMode: (isFocus: boolean) => void;
}

const ExamenesPracticosView: React.FC<ExamenesPracticosViewProps> = ({ isFocusMode, setIsFocusMode }) => {
    const { students, practicalExamEvaluations, handleSavePracticalExam } = useAppContext();
    
    const [activePeriod, setActivePeriod] = useState<ExamPeriod>('t1');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentEvaluation, setCurrentEvaluation] = useState<PracticalExamEvaluation | null>(null);

    const evaluatedStudents = useMemo(() => {
        return new Set(practicalExamEvaluations.filter(e => e.examPeriod === activePeriod).map(e => e.studentId));
    }, [practicalExamEvaluations, activePeriod]);

    const filteredStudents = useMemo(() => {
        return students
            .filter(student => {
                const fullName = `${student.nombre} ${student.apellido1} ${student.apellido2}`.toLowerCase();
                return fullName.includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => a.apellido1.localeCompare(b.apellido1));
    }, [students, searchTerm]);

    const calculateFinalScore = useCallback((evaluation: PracticalExamEvaluation | null): number => {
        if (!evaluation) return 0;
        let totalWeightedScore = 0;
        let totalWeightOfScoredItems = 0;
        PRACTICAL_EXAM_RUBRIC.forEach(ra => {
            let raScoreSum = 0;
            let criteriaInRaCount = 0;
            ra.criteria.forEach(criterion => {
                const scoreInfo = evaluation.scores?.[ra.id]?.[criterion.id];
                if (scoreInfo && typeof scoreInfo.score === 'number') {
                    raScoreSum += scoreInfo.score;
                    criteriaInRaCount++;
                }
            });
            if (criteriaInRaCount > 0) {
                const averageRaScore = raScoreSum / criteriaInRaCount;
                totalWeightedScore += averageRaScore * ra.weight;
                totalWeightOfScoredItems += ra.weight;
            }
        });
        if (totalWeightOfScoredItems === 0) return 0;
        return totalWeightedScore / totalWeightOfScoredItems;
    }, []);

    useEffect(() => {
        if (selectedStudentId) {
            const existingEval = practicalExamEvaluations.find(e => e.studentId === selectedStudentId && e.examPeriod === activePeriod);
            if (existingEval) {
                setCurrentEvaluation(JSON.parse(JSON.stringify(existingEval)));
            } else {
                const newEval: PracticalExamEvaluation = {
                    id: `${selectedStudentId}-${activePeriod}`,
                    studentId: selectedStudentId,
                    examPeriod: activePeriod,
                    scores: {},
                };
                setCurrentEvaluation(newEval);
            }
        } else {
            setCurrentEvaluation(null);
        }
    }, [selectedStudentId, activePeriod, practicalExamEvaluations]);


    const handleScoreChange = (raId: string, criterionId: string, score: number | null, notes: string | null) => {
        if (!currentEvaluation) return;
        const newEval = { ...currentEvaluation };
        if (!newEval.scores[raId]) newEval.scores[raId] = {};
        if (!newEval.scores[raId][criterionId]) newEval.scores[raId][criterionId] = { score: null, notes: '' };
        if (score !== null) newEval.scores[raId][criterionId].score = score;
        if (notes !== null) newEval.scores[raId][criterionId].notes = notes;
        setCurrentEvaluation(newEval);
    };

    const handleSaveEvaluation = () => {
        if (currentEvaluation) {
            const finalScore = calculateFinalScore(currentEvaluation);
            const evalToSave = { ...currentEvaluation, finalScore };
            handleSavePracticalExam(evalToSave);
        }
    };
    
    const finalScore = useMemo(() => calculateFinalScore(currentEvaluation), [currentEvaluation, calculateFinalScore]);

    const renderRubric = () => {
        if (!selectedStudentId || !currentEvaluation) {
            return (
                <div className="flex items-center justify-center h-full text-center text-gray-500">
                    <p>Selecciona un alumno de la lista para comenzar a evaluar.</p>
                </div>
            );
        }
        const student = students.find(s => s.id === selectedStudentId);

        return (
            <div className="p-4 sm:p-6 h-full flex flex-col">
                <header className="flex justify-between items-center mb-4 pb-4 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Evaluando a: {student?.nombre} {student?.apellido1}</h2>
                        <p className="text-sm text-gray-500">Rúbrica para el {activePeriod === 't1' ? '1º Trimestre' : activePeriod === 't2' ? '2º Trimestre' : activePeriod === 't3' ? '3º Trimestre' : 'Recuperación'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-500">NOTA FINAL</p>
                        <p className="text-4xl font-bold text-blue-600">{finalScore.toFixed(2)}</p>
                    </div>
                </header>
                <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {PRACTICAL_EXAM_RUBRIC.map(ra => (
                        <div key={ra.id} className="bg-white p-4 rounded-lg shadow-sm">
                            <h3 className="font-bold text-lg mb-3 text-gray-700">{ra.name} <span className="text-sm font-normal text-gray-500">({ra.weight * 100}%)</span></h3>
                            <div className="space-y-4">
                                {ra.criteria.map(criterion => {
                                    const currentScoreData = currentEvaluation?.scores?.[ra.id]?.[criterion.id];
                                    return (
                                        <div key={criterion.id} className="border-t pt-3">
                                            <p className="font-semibold mb-2">{criterion.name}</p>
                                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                                {SCORE_LEVELS.map(level => (
                                                    <button key={level.value}
                                                        onClick={() => handleScoreChange(ra.id, criterion.id, level.value, null)}
                                                        className={`px-3 py-1 text-sm text-white rounded-md transition-transform transform hover:scale-105 ${level.color} ${currentScoreData?.score === level.value ? 'ring-2 ring-offset-1 ring-black' : ''} ${currentScoreData?.score !== null && currentScoreData?.score !== level.value ? 'opacity-60' : ''}`}
                                                    >
                                                        {level.label} ({level.value})
                                                    </button>
                                                ))}
                                                {currentScoreData?.score !== null && (
                                                     <button onClick={() => handleScoreChange(ra.id, criterion.id, null, null)} className="text-xs text-gray-500 hover:text-red-500 ml-2">Limpiar</button>
                                                )}
                                            </div>
                                            <textarea
                                                placeholder="Anotaciones específicas..."
                                                value={currentScoreData?.notes || ''}
                                                onChange={(e) => handleScoreChange(ra.id, criterion.id, null, e.target.value)}
                                                className="w-full p-2 text-sm border rounded-md mt-1 bg-gray-50"
                                                rows={2}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                 <footer className="pt-4 mt-4 border-t">
                    <button onClick={handleSaveEvaluation} className="w-full flex items-center justify-center bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition">
                        <SaveIcon className="w-5 h-5 mr-2" />
                        Guardar Examen
                    </button>
                </footer>
            </div>
        );
    };

    return (
        <div className={`flex h-full ${isFocusMode ? 'p-2 sm:p-4' : ''}`}>
            <aside className={`flex flex-col bg-white shadow-lg ${isFocusMode ? 'w-full md:w-1/3' : 'w-full md:w-1/3 lg:w-1/4'}`}>
                <header className="p-4 border-b">
                    <h1 className="text-xl font-bold text-gray-800">Exámenes Prácticos</h1>
                    <div className="mt-2">
                        <div className="flex bg-gray-100 rounded-lg p-1">
                            {(['t1', 't2', 't3', 'rec'] as ExamPeriod[]).map(period => (
                                <button key={period} onClick={() => setActivePeriod(period)}
                                    className={`flex-1 px-2 py-1 text-sm font-semibold rounded-md transition ${activePeriod === period ? 'bg-white shadow text-blue-600' : 'text-gray-600'}`}
                                >
                                    {period === 't1' ? '1º Trim' : period === 't2' ? '2º Trim' : period === 't3' ? '3º Trim' : 'Recup'}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>
                <div className="p-4 border-b">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                           <SearchIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar alumno..."
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5" />
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto">
                    {filteredStudents.map(student => (
                        <a href="#" key={student.id} onClick={(e) => { e.preventDefault(); setSelectedStudentId(student.id);}}
                            className={`flex items-center p-3 text-sm transition-colors border-l-4 ${selectedStudentId === student.id ? 'bg-blue-50 border-blue-500' : 'border-transparent hover:bg-gray-50'}`}
                        >
                            <img src={student.fotoUrl} alt="" className="w-8 h-8 rounded-full object-cover mr-3"/>
                            <span className="flex-1 font-medium">{student.apellido1} {student.apellido2}, {student.nombre}</span>
                            {evaluatedStudents.has(student.id) && <span className="w-2 h-2 bg-green-500 rounded-full" title="Evaluado"></span>}
                        </a>
                    ))}
                </nav>
                 <footer className="p-2 border-t">
                    <button onClick={() => setIsFocusMode(!isFocusMode)}
                        className="w-full text-xs text-center text-gray-500 hover:text-blue-600 p-1">
                        {isFocusMode ? 'Salir de Modo Foco' : 'Activar Modo Foco'}
                    </button>
                </footer>
            </aside>
            <main className="flex-1 bg-gray-50">
                {renderRubric()}
            </main>
        </div>
    );
};

export default ExamenesPracticosView;