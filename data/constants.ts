export const PRE_SERVICE_BEHAVIOR_ITEMS = [
    { id: 'respects_rules', label: 'Respeta las normas y no interrumpe.' },
    { id: 'is_kind', label: 'Es amable y trata bien a los compañeros.' },
    { id: 'clean_uniform', label: 'Trae limpio el uniforme.' },
    { id: 'is_participative', label: 'Se muestra participativo e interesado.' },
    { id: 'brings_material', label: 'Trae el material de trabajo (Fichas técnicas, etc.).' },
];

export const BEHAVIOR_RATING_MAP: { symbol: string, value: number, label: string, color: string, selectedColor: string }[] = [
    { symbol: '++', value: 2, label: 'Muy Bien', color: 'bg-green-100 text-green-800', selectedColor: 'bg-green-500 text-white ring-2 ring-green-700' },
    { symbol: '+', value: 1, label: 'Bien', color: 'bg-blue-100 text-blue-800', selectedColor: 'bg-blue-500 text-white ring-2 ring-blue-700' },
    { symbol: '-', value: 0, label: 'Casi Nunca', color: 'bg-red-100 text-red-800', selectedColor: 'bg-red-500 text-white ring-2 ring-red-700' },
];

export const GROUP_EVALUATION_ITEMS = [
    { id: 'planning', label: 'Planifica y organiza la mise en place', maxScore: 1.00 },
    { id: 'ingredient_handling', label: 'Selecciona, manipula y conserva ingredientes', maxScore: 1.50 },
    { id: 'timing_control', label: 'Controla los tiempos de cocción', maxScore: 1.00 },
    { id: 'hygiene_safety', label: 'Mantiene normas de higiene y seguridad', maxScore: 1.50 },
    { id: 'coordination', label: 'Coordina el trabajo con compañeros', maxScore: 1.00 },
    { id: 'error_identification', label: 'Identifica errores y propone soluciones', maxScore: 1.00 },
    { id: 'teamwork', label: 'Trabajo en equipo y actitud activa', maxScore: 1.00 },
    { id: 'waste_management', label: 'Gestiona ingredientes sobrantes (minimiza desperdicio)', maxScore: 2.00 },
];

export const INDIVIDUAL_EVALUATION_ITEMS = [
    { id: 'machinery_startup', label: 'Puesta en marcha de maquinaria', maxScore: 0.50 },
    { id: 'mise_en_place', label: 'Realización de mise-en-place', maxScore: 1.00 },
    { id: 'read_recipes', label: 'Interpretación de fichas técnicas', maxScore: 1.50 },
    { id: 'required_material', label: 'Asistencia con material requerido', maxScore: 1.00 },
    { id: 'task_execution', label: 'Ejecución de tareas y técnicas', maxScore: 1.00 },
    { id: 'clean_work', label: 'Trabajo limpio y ordenado', maxScore: 1.00 },
    { id: 'teamwork_attitude', label: 'Trabajo en equipo y actitud activa', maxScore: 1.50 },
    { id: 'conservation_techniques', label: 'Aplicación de técnicas de conservación', maxScore: 0.50 },
    { id: 'equipment_cleaning', label: 'Limpieza y mantenimiento de equipos', maxScore: 1.00 },
    { id: 'personal_hygiene', label: 'Higiene personal y uniforme', maxScore: 1.00 },
];

// Centralized weights for service grade calculations
export const SERVICE_GRADE_WEIGHTS = {
    individual: 0.6,
    group: 0.4,
};


// --- New Constants for Practical Exams ---

export const SCORE_LEVELS = [
    { label: 'Excelente', value: 10, color: 'bg-green-500', hoverColor: 'bg-green-600' },
    { label: 'Notable', value: 8, color: 'bg-blue-500', hoverColor: 'bg-blue-600' },
    { label: 'Aprobado', value: 5, color: 'bg-yellow-500', hoverColor: 'bg-yellow-600' },
    { label: 'Insuficiente', value: 2, color: 'bg-red-500', hoverColor: 'bg-red-600' },
];

export const PRACTICAL_EXAM_RUBRIC = [
    {
        id: 'ra1',
        name: 'R.A.1 – Organización de procesos',
        weight: 0.20, // 20%
        criteria: [
            { id: 'c1_1', name: 'Planificación y mise en place' },
            { id: 'c1_2', name: 'Orden, limpieza y conservación' },
        ],
    },
    {
        id: 'ra2',
        name: 'R.A.2 – Técnicas culinarias tradicionales y avanzadas',
        weight: 0.30, // 30%
        criteria: [
            { id: 'c2_1', name: 'Aplicación de técnicas básicas' },
            { id: 'c2_2', name: 'Aplicación de técnicas avanzadas' },
            { id: 'c2_3', name: 'Evaluación del resultado final' },
        ],
    },
    {
        id: 'ra3',
        name: 'R.A.3 – Elaboración a partir de materias primas',
        weight: 0.30, // 30%
        criteria: [
            { id: 'c3_1', name: 'Creatividad y propuestas' },
            { id: 'c3_2', name: 'Aprovechamiento de recursos' },
            { id: 'c3_3', name: 'Organización y ejecución' },
        ],
    },
    {
        id: 'ra4',
        name: 'R.A.4 – Necesidades alimenticias específicas',
        weight: 0.20, // 20%
        criteria: [
            { id: 'c4_1', name: 'Identificación y selección de alimentos' },
            { id: 'c4_2', name: 'Prevención de contaminación cruzada' },
            { id: 'c4_3', name: 'Resultado final y justificación' },
        ],
    },
];

// --- New Constants for Academic Management ---

export const COURSE_MODULES = [
    'Ofertas gastronómicas',
    'Productos culinarios',
    'Postres en restauración',
    'Itinerario personal para la Empleabilidad II',
    'Proyecto Intermodular',
    'Sostenibilidad aplicada al sistema productivo',
    'Optativa'
];

export const ACADEMIC_EVALUATION_STRUCTURE = {
  periods: [
    {
      key: "t1",
      name: "1º Trimestre",
      instruments: [
        { name: "Examen 1", type: "manual", key: "examen1", weight: 0.25 },
        { name: "Examen 2", type: "manual", key: "examen2", weight: 0.25 },
        { name: "Servicios", type: "calculated", key: "servicios", weight: 0.30 },
        { name: "Ex. Práctico", type: "calculated", key: "exPracticoT1", weight: 0.20 },
      ]
    },
    {
      key: "t2",
      name: "2º Trimestre",
      instruments: [
        { name: "Examen 1", type: "manual", key: "examen1", weight: 0.25 },
        { name: "Examen 2", type: "manual", key: "examen2", weight: 0.25 },
        { name: "Servicios", type: "calculated", key: "servicios", weight: 0.30 },
        { name: "Ex. Práctico", type: "calculated", key: "exPracticoT2", weight: 0.20 },
      ]
    },
     {
      key: "t3",
      name: "3º Trimestre",
      instruments: [
        { name: "Examen 1", type: "manual", key: "examen1", weight: 0.25 },
        { name: "Examen 2", type: "manual", key: "examen2", weight: 0.25 },
        { name: "Servicios", type: "calculated", key: "servicios", weight: 0.30 },
        { name: "Ex. Práctico", type: "calculated", key: "exPracticoT3", weight: 0.20 },
      ]
    },
    {
      key: "rec",
      name: "Recuperación",
      instruments: [
        { name: "Examen REC", type: "manual", key: "examenRec", weight: 0.50 },
        { name: "Ex. Práctico REC", type: "calculated", key: "exPracticoRec", weight: 0.50 },
      ]
    }
  ]
};