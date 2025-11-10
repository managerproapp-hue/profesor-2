import React from 'react';
import { 
    UsersIcon, 
    GroupIcon,
    ClipboardListIcon,
    CalendarPlusIcon,
    ClipboardCheckIcon,
    SettingsIcon
} from './icons';

interface DashboardProps {
  studentCount: number;
  groupCount: number;
  onNavigate: (page: string) => void;
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


const Dashboard: React.FC<DashboardProps> = ({ studentCount, groupCount, onNavigate }) => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Bienvenido/a, Nombre del Profesor</h1>
        <p className="text-gray-500 mt-1">Aquí tienes un resumen rápido de tu espacio de trabajo.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={UsersIcon} title="Total Alumnos" value={studentCount} color="#3b82f6" />
        <StatCard icon={GroupIcon} title="Grupos de Alumnos" value={groupCount} color="#10b981" />
        <StatCard icon={ClipboardListIcon} title="Servicios Planificados" value="0" color="#f59e0b" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <ActionCard icon={UsersIcon} title="Gestionar Alumnos" description="Añade, modifica o importa alumnos" onClick={() => onNavigate('alumnos')} color="#3b82f6" />
                <ActionCard icon={CalendarPlusIcon} title="Planificar Servicios" description="Organiza las clases prácticas" onClick={() => onNavigate('gestion-practica')} color="#f59e0b" />
                <ActionCard icon={ClipboardCheckIcon} title="Calificar Servicios" description="Evalúa los servicios prácticos" onClick={() => onNavigate('calificaciones')} color="#10b981" />
                <ActionCard icon={SettingsIcon} title="Ajustes y Backups" description="Configura y guarda tus datos" onClick={() => onNavigate('ajustes')} color="#6b7280" />
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

export default Dashboard;
