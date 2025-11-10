import React, { ReactNode } from 'react';

// FIX: GradeValue was incorrectly imported. It is now defined here as a reusable type and exported.
export type GradeValue = number | string | null;

export interface Student {
  id: string;
  nre: string;
  expediente: string;
  apellido1: string;
  apellido2: string;
  nombre: string;
  grupo: string;
  subgrupo: string;
  fechaNacimiento: string;
  telefono: string;
  emailPersonal: string;
  emailOficial: string;
  fotoUrl: string;
}

export interface PracticeGroup {
  id: string;
  name: string;
  color: string;
  studentIds: string[];
}

export interface StudentRoleAssignment {
    studentId: string;
    roleId: string | null;
}

export interface Elaboration {
    id:string;
    name: string;
    responsibleGroupId: string | null;
}

export interface Service {
  id: string;
  name: string;
  date: string;
  isLocked: boolean;
  assignedGroups: {
      comedor: string[];
      takeaway: string[];
  };
  elaborations: {
    comedor: Elaboration[];
    takeaway: Elaboration[];
  };
  studentRoles: StudentRoleAssignment[];
  evaluationId?: string | null;
}

export interface PreServiceIndividualEvaluation {
    attendance: boolean;
    hasFichas: boolean;
    hasUniforme: boolean;
    hasMaterial: boolean;
    behaviorScores: { [itemId: string]: number | null }; // 2 for ++, 1 for +, 0 for -
    observations: string;
}

export interface ServiceDayGroupScores {
    scores: (number | null)[];
    observations: string;
}

export interface ServiceDayIndividualScores {
    attendance: boolean;
    scores: (number | null)[];
    observations: string;
}

export interface PreServiceDayEvaluation {
    name?: string;
    groupObservations: { [groupId: string]: string };
    individualEvaluations: { [studentId: string]: PreServiceIndividualEvaluation };
}

export interface ServiceEvaluation {
    id: string;
    serviceId: string;
    preService: { [date: string]: PreServiceDayEvaluation };
    serviceDay: {
        groupScores: { [groupId: string]: ServiceDayGroupScores };
        individualScores: { [studentId: string]: ServiceDayIndividualScores };
    };
}


export interface EntryExitRecord {
  id: string;
  studentId: string;
  date: string;
  type: 'Salida Anticipada' | 'Llegada Tarde';
  reason: string;
}

export interface ServiceRole {
  id: string;
  name: string;
  color: string;
  type: 'leader' | 'secondary';
}

export type ExamPeriod = 't1' | 't2' | 'rec';

export interface PracticalExamEvaluation {
    id: string;
    studentId: string;
    examPeriod: ExamPeriod;
    scores: Record<string, Record<string, { score: number | null; notes: string }>>;
    finalScore?: number;
}

export interface TeacherData {
  name: string;
  email: string;
  logo: string | null;
}
export interface InstituteData {
  name: string;
  address: string;
  cif: string;
  logo: string | null;
}

// Type for the calculated summary of grades for a student
export interface StudentCalculatedGrades {
    serviceAverage: number | null;
    practicalExams: {
        t1: number | null;
        t2: number | null;
        rec: number | null;
    };
}

// --- LEGACY TYPES for pages/FichaAlumno.tsx (not used in main app flow) ---
export interface PrincipalGrade {
    servicios?: GradeValue;
    practico?: GradeValue;
    teorico1?: GradeValue;
    teorico2?: GradeValue;
}

export interface PrincipalGrades {
    [studentId: string]: {
        t1?: PrincipalGrade;
        t2?: PrincipalGrade;
        t3?: PrincipalGrade;
        recFinal?: GradeValue;
    }
}

export interface OtherModuleGrade {
    t1?: GradeValue;
    t2?: GradeValue;
    t3?: GradeValue;
    rec?: GradeValue;
}

export interface OtherGrades {
    [studentId: string]: {
        [moduleName: string]: OtherModuleGrade;
    }
}


// --- NEW ACADEMIC MANAGEMENT TYPES ---

export interface ManualGradeEntry {
    [instrumentKey: string]: GradeValue;
}

export interface AcademicPeriodGrades {
    manualGrades: ManualGradeEntry;
}

export interface StudentAcademicGrades {
    [periodKey: string]: AcademicPeriodGrades;
}

export interface AcademicGrades {
    [studentId: string]: StudentAcademicGrades;
}

export interface CourseModuleGrades {
    t1?: GradeValue;
    t2?: GradeValue;
    t3?: GradeValue;
    rec?: GradeValue;
}

export interface StudentCourseGrades {
    [moduleName: string]: CourseModuleGrades;
}

export interface CourseGrades {
    [studentId: string]: StudentCourseGrades;
}

// --- NEW TOAST NOTIFICATION TYPE ---
export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

// --- NEW APP CONTEXT TYPE ---
export interface AppContextType {
    // State
    students: Student[];
    practiceGroups: PracticeGroup[];
    services: Service[];
    serviceEvaluations: ServiceEvaluation[];
    serviceRoles: ServiceRole[];
    entryExitRecords: EntryExitRecord[];
    practicalExamEvaluations: PracticalExamEvaluation[];
    teacherData: TeacherData;
    instituteData: InstituteData;
    academicGrades: AcademicGrades;
    courseGrades: CourseGrades;
    toasts: Toast[];

    // Setters / Handlers
    setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
    setPracticeGroups: React.Dispatch<React.SetStateAction<PracticeGroup[]>>;
    setServices: React.Dispatch<React.SetStateAction<Service[]>>;
    setServiceEvaluations: React.Dispatch<React.SetStateAction<ServiceEvaluation[]>>;
    setServiceRoles: React.Dispatch<React.SetStateAction<ServiceRole[]>>;
    setEntryExitRecords: React.Dispatch<React.SetStateAction<EntryExitRecord[]>>;
    setPracticalExamEvaluations: React.Dispatch<React.SetStateAction<PracticalExamEvaluation[]>>;
    setTeacherData: React.Dispatch<React.SetStateAction<TeacherData>>;
    setInstituteData: React.Dispatch<React.SetStateAction<InstituteData>>;
    setAcademicGrades: React.Dispatch<React.SetStateAction<AcademicGrades>>;
    setCourseGrades: React.Dispatch<React.SetStateAction<CourseGrades>>;
    
    // Calculated Data
    calculatedStudentGrades: Record<string, StudentCalculatedGrades>;

    // Business Logic Functions
    handleFileUpload: (file: File) => Promise<{ success: boolean; error?: string | null; }>;
    handleSaveEntryExitRecord: (record: Omit<EntryExitRecord, 'studentId' | 'id'>, studentIds: string[]) => void;
    handleSavePracticalExam: (evaluation: PracticalExamEvaluation) => void;
    handleCreateService: () => string;
    handleSaveServiceAndEvaluation: (service: Service, evaluation: ServiceEvaluation) => void;
    handleDeleteService: (serviceId: string) => void;
    handleDeleteRole: (roleId: string) => void;
    handleUpdateStudent: (student: Student) => void;
    
    // Toast Notifications
    addToast: (message: string, type: ToastType) => void;
}

// --- NEW PROVIDER PROPS TYPE ---
export interface AppProviderProps {
    children: ReactNode;
}

// --- NEW REPORTING VIEW MODEL ---
export interface ReportViewModel {
    service: Service;
    evaluation: ServiceEvaluation;
    students: Student[];
    practiceGroups: PracticeGroup[];
    serviceRoles: ServiceRole[];
    teacherData: TeacherData;
    instituteData: InstituteData;
    entryExitRecords: EntryExitRecord[];
    // Derived data
    participatingStudents: Student[];
    groupedStudentsInService: {
        group: PracticeGroup;
        students: Student[];
    }[];
}
