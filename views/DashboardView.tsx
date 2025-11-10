import React, { useState } from 'react';
import { 
    UsersIcon, 
    GroupIcon,
    ClipboardListIcon,
    CalendarPlusIcon,
    ClipboardCheckIcon,
    SettingsIcon,
    ClipboardListIcon as GestionAcademicaIcon
} from '../components/icons';
import FileUpload from '../components/FileUpload';
import { useAppContext } from '../context/AppContext';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
}

const StatCard: React.FC<{ icon: React.ElementType, title: string, value: string | number, color: string }> = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white p-5 rounded-xl shadow-md flex items-center space-x-4 border-l-4" style={{ borderColor: color }}>
        <div className="flex-shrink-0">
            <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-6 h-6" style={{ color: color }} />
            </div>
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const ActionCard: React.FC<{ icon: React.ElementType, title: string, description: string, onClick: () => void, color: string }> = ({ icon: Icon, title, description, onClick, color }) => (
    <button onClick={onClick} className="bg-white p-6 rounded-xl shadow-md text-left w-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center space-x-4">
            <div className="p-3 rounded-lg" style={{ backgroundColor: `${color}20` }}>
                <Icon className="w-8 h-8" style={{ color: color }} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
        </div>
    </button>
);


const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
    const { students, practiceGroups, services, handleFileUpload: contextHandleFileUpload } = useAppContext();
    const [loading, setLoading] = useState(false);

    const handleFileUpload = async (file: File) => {
        setLoading(true);
        await contextHandleFileUpload(file);
        setLoading(false);
    }
    
    if (students.length === 0) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-md text-center">
                <h1 className="text-3xl font-bold text-gray-800">¡Bienvenido a TeacherDash!</h1>
                <p className="text-gray-500 mt-2 mb-6">Para comenzar, importa la lista de tus alumnos desde un archivo Excel.</p>
                <div className="max-w-xl mx-auto">
                    <FileUpload onFileUpload={handleFileUpload} disabled={loading} />
                    {loading && <p className="text-center mt-4 text-blue-500">Procesando archivo...</p>}
                </div>
                <p className="text-sm text-gray-400 mt-6">
                    ¿Necesitas restaurar datos? Ve a <button onClick={() => onNavigate('gestion-app')} className="text-blue-500 hover:underline font-semibold">Gestión App</button> para usar una copia de seguridad.
                </p>
            </div>
        )
    }
    
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Bienvenido a TeacherDash</h1>
                <p className="text-gray-500 mt-1">Aquí tienes un resumen rápido de tu espacio de trabajo.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                <StatCard icon={UsersIcon} title="Total Alumnos" value={students.length} color="#3b82f6" />
                <StatCard icon={GroupIcon} title="Grupos Definidos" value={practiceGroups.length} color="#10b981" />
                <StatCard icon={ClipboardListIcon} title="Servicios Planificados" value={services.length} color="#f59e0b" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Acciones Rápidas</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <ActionCard icon={UsersIcon} title="Gestionar Alumnos" description="Visualiza y edita las fichas" onClick={() => onNavigate('alumnos')} color="#3b82f6" />
                        <ActionCard icon={CalendarPlusIcon} title="Planificar Servicios" description="Organiza las clases prácticas" onClick={() => onNavigate('gestion-practica')} color="#f59e0b" />
                        <ActionCard icon={GestionAcademicaIcon} title="Gestión Académica" description="Centraliza todas las notas" onClick={() => onNavigate('gestion-academica')} color="#8b5cf6" />
                        <ActionCard icon={SettingsIcon} title="Ajustes y Backups" description="Configura y guarda tus datos" onClick={() => onNavigate('gestion-app')} color="#6b7280" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Próximos Servicios</h2>
                    <div className="text-center py-10">
                        <p className="text-gray-500">No hay próximos servicios planificados.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
