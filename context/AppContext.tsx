import React, { createContext, useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { AppContextType, AppProviderProps, Student, PracticeGroup, Service, ServiceEvaluation, ServiceRole, EntryExitRecord, PracticalExamEvaluation, TeacherData, InstituteData, AcademicGrades, CourseGrades, Toast, ToastType, StudentCalculatedGrades, PreServiceDayEvaluation } from '../types';
import { parseFile } from '../services/csvParser';
import { SERVICE_GRADE_WEIGHTS } from '../data/constants';

// --- Create Context ---
const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Custom Persistent State Hook ---
const usePersistentState = <T,>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
    const [state, setState] = useState<T>(() => {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : defaultValue;
        } catch (error) {
            console.warn(`Warning: Could not read localStorage key "${key}". Defaulting value.`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.warn(`Warning: Could not set localStorage key "${key}". State may not be saved.`, error);
        }
    }, [key, state]);

    return [state, setState];
};

// --- Helper Functions ---
const getTuesday = (serviceDateStr: string): string => {
    const serviceDate = new Date(serviceDateStr);
    serviceDate.setHours(12, 0, 0, 0);
    const dayOfWeek = serviceDate.getDay();
    const dateOffset = dayOfWeek >= 2 ? dayOfWeek - 2 : (dayOfWeek + 7 - 2);
    serviceDate.setDate(serviceDate.getDate() - dateOffset);
    return serviceDate.toISOString().split('T')[0];
};

// --- App Provider Component ---
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    // --- STATE MANAGEMENT ---
    const [students, setStudents] = usePersistentState<Student[]>('students', []);
    const [practiceGroups, setPracticeGroups] = usePersistentState<PracticeGroup[]>('practiceGroups', []);
    const [services, setServices] = usePersistentState<Service[]>('services', []);
    const [serviceEvaluations, setServiceEvaluations] = usePersistentState<ServiceEvaluation[]>('serviceEvaluations', []);
    const [serviceRoles, setServiceRoles] = usePersistentState<ServiceRole[]>('serviceRoles', [
        { id: 'leader-1', name: 'Jefe de Cocina', color: '#EF4444', type: 'leader' },
        { id: 'leader-2', name: '2º Jefe de Cocina', color: '#22C55E', type: 'leader' },
        { id: 'leader-3', name: '2º Jefe de Takeaway', color: '#22C55E', type: 'leader' },
        { id: 'secondary-1', name: 'Jefe de Partida', color: '#EAB308', type: 'secondary' },
        { id: 'secondary-2', name: 'Cocinero', color: '#60A5FA', type: 'secondary' },
        { id: 'secondary-3', name: 'Ayudante', color: '#4ADE80', type: 'secondary' },
        { id: 'secondary-4', name: 'Sin servicio 1', color: '#A78BFA', type: 'secondary' },
        { id: 'secondary-5', name: 'Sin servicio 2', color: '#A78BFA', type: 'secondary' },
    ]);
    const [entryExitRecords, setEntryExitRecords] = usePersistentState<EntryExitRecord[]>('entryExitRecords', []);
    const [practicalExamEvaluations, setPracticalExamEvaluations] = usePersistentState<PracticalExamEvaluation[]>('practicalExamEvaluations', []);
    const [teacherData, setTeacherData] = usePersistentState<TeacherData>('teacher-app-data', { name: '', email: '', logo: null });
    const [instituteData, setInstituteData] = usePersistentState<InstituteData>('institute-app-data', { name: '', address: '', cif: '', logo: null });
    const [academicGrades, setAcademicGrades] = usePersistentState<AcademicGrades>('academicGrades', {});
    const [courseGrades, setCourseGrades] = usePersistentState<CourseGrades>('courseGrades', {});

    // --- TOAST NOTIFICATION STATE ---
    const [toasts, setToasts] = useState<Toast[]>([]);
    const addToast = (message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
        }, 3000);
    };

    // --- DATA MIGRATIONS ---
    useEffect(() => {
        // Migration to add 'name' to preService days
        const needsNameMigration = serviceEvaluations.some(ev => 
            Object.values(ev.preService || {}).some(psd => psd && typeof (psd as PreServiceDayEvaluation).name === 'undefined')
        );

        if (needsNameMigration) {
            console.log("Running migration: Add names to pre-service days...");
            setServiceEvaluations(prev => prev.map(ev => {
                const newPreService: { [date: string]: PreServiceDayEvaluation } = {};
                Object.entries(ev.preService || {}).forEach(([date, psd]) => {
                    if (psd && typeof psd === 'object') {
                        newPreService[date] = {
                            ...(psd as PreServiceDayEvaluation),
                            name: (psd as PreServiceDayEvaluation).name || `Pre-servicio ${new Date(date + 'T12:00:00Z').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`
                        };
                    }
                });
                return { ...ev, preService: newPreService };
            }));
        }

        // Migration to add 'isLocked' to services
        const needsLockMigration = services.some(s => typeof s.isLocked === 'undefined');
        if (needsLockMigration) {
             console.log("Running migration: Add isLocked flag to services...");
             setServices(prev => prev.map(s => ({ ...s, isLocked: s.isLocked ?? false })));
        }

    }, []); // Run only once on initial load

    // --- CALCULATED DATA ---
    const calculatedStudentGrades = useMemo((): Record<string, StudentCalculatedGrades> => {
        const studentGrades: Record<string, StudentCalculatedGrades> = {};
        students.forEach(student => {
            const t1Exam = practicalExamEvaluations.find(e => e.studentId === student.id && e.examPeriod === 't1');
            const t2Exam = practicalExamEvaluations.find(e => e.studentId === student.id && e.examPeriod === 't2');
            const recExam = practicalExamEvaluations.find(e => e.studentId === student.id && e.examPeriod === 'rec');
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
            const serviceAverage = serviceGrades.length > 0 ? serviceGrades.reduce((sum, grade) => sum + grade, 0) / serviceGrades.length : null;
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

    // --- BUSINESS LOGIC FUNCTIONS ---
    const handleFileUpload = async (file: File) => {
        const result = await parseFile(file);
        if (result.error) {
            addToast(result.error, 'error');
            return { success: false, error: result.error };
        } else {
            setStudents(result.data);
            addToast('Alumnos importados con éxito.', 'success');
            return { success: true };
        }
    };

    const handleSaveEntryExitRecord = (record: Omit<EntryExitRecord, 'studentId' | 'id'>, studentIds: string[]) => {
        const newRecords: EntryExitRecord[] = studentIds.map(studentId => ({ ...record, id: `${studentId}-${Date.now()}`, studentId }));
        setEntryExitRecords(prev => [...prev, ...newRecords]);
        addToast('Registro de Salida/Entrada guardado.', 'success');
    };
    
    const handleSavePracticalExam = (evaluation: PracticalExamEvaluation) => {
        setPracticalExamEvaluations(prev => {
            const index = prev.findIndex(e => e.id === evaluation.id);
            if (index > -1) {
                const newEvals = [...prev];
                newEvals[index] = evaluation;
                return newEvals;
            }
            return [...prev, evaluation];
        });
        addToast('Examen práctico guardado.', 'success');
    };
    
    const handleCreateService = useCallback(() => {
        const newServiceId = `service-${Date.now()}`;
        const serviceDate = new Date().toISOString().split('T')[0];
        const preServiceDate = getTuesday(serviceDate);
        const newService: Service = { id: newServiceId, name: `Nuevo Servicio ${new Date().toLocaleDateString('es-ES')}`, date: serviceDate, isLocked: false, assignedGroups: { comedor: [], takeaway: [] }, elaborations: { comedor: [], takeaway: [] }, studentRoles: [] };
        const newEvaluation: ServiceEvaluation = { id: `eval-${newServiceId}`, serviceId: newServiceId, preService: { [preServiceDate]: { name: `Pre-servicio ${new Date(preServiceDate + 'T12:00:00Z').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}`, groupObservations: {}, individualEvaluations: {} } }, serviceDay: { groupScores: {}, individualScores: {} } };
        setServices(prev => [...prev, newService]);
        setServiceEvaluations(prev => [...prev, newEvaluation]);
        return newServiceId;
    }, [setServices, setServiceEvaluations]);

    const handleSaveServiceAndEvaluation = useCallback((service: Service, evaluation: ServiceEvaluation) => {
        setServices(prev => prev.map(s => s.id === service.id ? service : s));
        setServiceEvaluations(prev => prev.map(e => e.id === evaluation.id ? evaluation : e));
        addToast('Servicio guardado con éxito.', 'success');
    }, [setServices, setServiceEvaluations]);

    const handleDeleteService = (serviceId: string) => {
        setServices(prev => prev.filter(s => s.id !== serviceId));
        setServiceEvaluations(prev => prev.filter(e => e.serviceId !== serviceId));
        addToast('Servicio eliminado.', 'info');
    };
    
    const handleDeleteRole = (roleId: string) => {
        setServiceRoles(prev => prev.filter(r => r.id !== roleId));
        setServices(prevServices => prevServices.map(service => ({ ...service, studentRoles: service.studentRoles.filter(sr => sr.roleId !== roleId) })));
        addToast('Rol eliminado.', 'info');
    };

    const handleUpdateStudent = (updatedStudent: Student) => {
        setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
        addToast('Ficha del alumno actualizada.', 'success');
    };

    // --- CONTEXT VALUE ---
    const value: AppContextType = {
        students, setStudents,
        practiceGroups, setPracticeGroups,
        services, setServices,
        serviceEvaluations, setServiceEvaluations,
        serviceRoles, setServiceRoles,
        entryExitRecords, setEntryExitRecords,
        practicalExamEvaluations, setPracticalExamEvaluations,
        teacherData, setTeacherData,
        instituteData, setInstituteData,
        academicGrades, setAcademicGrades,
        courseGrades, setCourseGrades,
        toasts,
        calculatedStudentGrades,
        handleFileUpload,
        handleSaveEntryExitRecord,
        handleSavePracticalExam,
        handleCreateService,
        handleSaveServiceAndEvaluation,
        handleDeleteService,
        handleDeleteRole,
        handleUpdateStudent,
        addToast
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// --- Custom Hook to use AppContext ---
export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};