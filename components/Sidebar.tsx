import React, { useState } from 'react';
import {
  DashboardIcon,
  UsersIcon,
  ChefHatIcon,
  ClipboardCheckIcon,
  BookOpenIcon,
  ArrowRightLeftIcon,
  GroupIcon,
  PencilRulerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SettingsIcon,
  FileTextIcon,
  ClipboardListIcon
} from './icons';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const NavLink: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  isCollapsed: boolean;
}> = ({ icon: Icon, label, isActive, onClick, isCollapsed }) => {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
        ${isCollapsed ? 'justify-center' : ''}
        ${isActive
          ? 'bg-[#4CAF50] text-white shadow-md'
          : 'text-gray-300 hover:bg-white/10 hover:text-white'
        }`}
      title={isCollapsed ? label : undefined}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 transition-all ${isCollapsed ? 'm-0' : 'mr-3'}`} />
      <span className={`whitespace-nowrap ${isCollapsed ? 'hidden' : 'inline'}`}>{label}</span>
    </a>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 bg-[#2D2D30] shadow-lg hidden md:flex flex-col transition-all duration-300 ease-in-out`}>
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center justify-center px-4 border-b border-white/10">
           {isCollapsed ? (
            <ChefHatIcon className="w-8 h-8 text-white" />
          ) : (
            <h1 className="text-xl font-bold tracking-wider">
              <span className="text-white">Teacher</span><span className="text-blue-500">Dash</span>
            </h1>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <h3 className={`px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider ${isCollapsed ? 'hidden' : 'block'}`}>
            Principal
          </h3>
          <NavLink
            icon={DashboardIcon}
            label="Dashboard"
            isActive={activeView === 'dashboard'}
            onClick={() => setActiveView('dashboard')}
            isCollapsed={isCollapsed}
          />
          <NavLink
            icon={UsersIcon}
            label="Alumnos"
            isActive={activeView === 'alumnos'}
            onClick={() => setActiveView('alumnos')}
            isCollapsed={isCollapsed}
          />
          <NavLink
            icon={GroupIcon}
            label="Definir Grupos"
            isActive={activeView === 'definir-grupos'}
            onClick={() => setActiveView('definir-grupos')}
            isCollapsed={isCollapsed}
          />
          <NavLink
            icon={ChefHatIcon}
            label="Gestión Práctica"
            isActive={activeView === 'gestion-practica'}
            onClick={() => setActiveView('gestion-practica')}
            isCollapsed={isCollapsed}
          />
          <NavLink
            icon={PencilRulerIcon}
            label="Exámenes Prácticos"
            isActive={activeView === 'examenes-practicos'}
            onClick={() => setActiveView('examenes-practicos')}
            isCollapsed={isCollapsed}
          />
           <h3 className={`px-4 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider ${isCollapsed ? 'hidden' : 'block'}`}>
            Calificaciones
          </h3>
          <NavLink
            icon={ClipboardListIcon}
            label="Gestión Académica"
            isActive={activeView === 'gestion-academica'}
            onClick={() => setActiveView('gestion-academica')}
            isCollapsed={isCollapsed}
          />
          <NavLink
            icon={ClipboardCheckIcon}
            label="Resumen Servicios"
            isActive={activeView === 'calificaciones'}
            onClick={() => setActiveView('calificaciones')}
            isCollapsed={isCollapsed}
          />

          <h3 className={`px-4 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider ${isCollapsed ? 'hidden' : 'block'}`}>
            Otros
          </h3>
          <NavLink
            icon={ArrowRightLeftIcon}
            label="Salidas/Entradas"
            isActive={activeView === 'salidas-entradas'}
            onClick={() => setActiveView('salidas-entradas')}
            isCollapsed={isCollapsed}
          />
          <NavLink
            icon={SettingsIcon}
            label="Gestión App"
            isActive={activeView === 'gestion-app'}
            onClick={() => setActiveView('gestion-app')}
            isCollapsed={isCollapsed}
          />
        </nav>
        
        <div className="p-2 border-t border-white/10">
           <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
            title={isCollapsed ? 'Expandir' : 'Colapsar'}
          >
            {isCollapsed ? <ChevronRightIcon className="w-6 h-6" /> : <ChevronLeftIcon className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;