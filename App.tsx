import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { ToastContainer } from './components/Toast';

// Lazy load views for better performance and code splitting
const Header = lazy(() => import('./components/Header'));
const Sidebar = lazy(() => import('./components/Sidebar'));
const DashboardView = lazy(() => import('./views/DashboardView'));
const AlumnosView = lazy(() => import('./views/AlumnosView'));
const DefinirGruposView = lazy(() => import('./views/DefinirGruposView'));
const GestionPracticaView = lazy(() => import('./views/GestionPracticaView'));
const ExamenesPracticosView = lazy(() => import('./views/ExamenesPracticosView'));
const NotasServicioView = lazy(() => import('./views/NotasServicioView'));
const RegistroSalidasEntradasView = lazy(() => import('./views/RegistroSalidasEntradasView'));
const GestionAppView = lazy(() => import('./views/GestionAppView'));
const GestionAcademicaView = lazy(() => import('./views/GestionAcademicaView'));


const AppContent: React.FC = () => {
    // --- VIEW & NAVIGATION STATE ---
    const [activeView, setActiveView] = useState('dashboard');
    const [initialServiceId, setInitialServiceId] = useState<string | null>(null);
    const [initialServiceTab, setInitialServiceTab] = useState<'planning' | 'evaluation' | null>(null);
    const [isFocusMode, setIsFocusMode] = useState(false);
    
    const { toasts } = useAppContext();
    
    // --- NAVIGATION HELPERS ---
    const handleNavigateToService = (serviceId: string, tab: 'planning' | 'evaluation' | null = 'planning') => {
        setInitialServiceId(serviceId);
        setInitialServiceTab(tab);
        setActiveView('gestion-practica');
    };
    
    const clearInitialServiceContext = () => {
        setInitialServiceId(null);
        setInitialServiceTab(null);
    }

    // --- VIEW ROUTER ---
    const renderView = () => {
        switch (activeView) {
            case 'dashboard':
                return <DashboardView onNavigate={setActiveView} />;
            case 'alumnos':
                return <AlumnosView />;
            case 'definir-grupos':
                return <DefinirGruposView />;
            case 'gestion-practica':
                return <GestionPracticaView 
                    initialServiceId={initialServiceId}
                    initialServiceTab={initialServiceTab}
                    clearInitialServiceContext={clearInitialServiceContext}
                />;
            case 'examenes-practicos':
                return <ExamenesPracticosView isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} />;
            case 'calificaciones':
                return <NotasServicioView onNavigateToService={handleNavigateToService} />;
            case 'gestion-academica':
                return <GestionAcademicaView />;
            case 'salidas-entradas':
                return <RegistroSalidasEntradasView />;
            case 'gestion-app':
                return <GestionAppView />;
            default:
                return <DashboardView onNavigate={setActiveView} />;
        }
    };
    
    const LoadingFallback = () => <div className="flex-1 p-6 sm:p-8 flex items-center justify-center"><p>Cargando vista...</p></div>;
    
    const mainContentClass = isFocusMode && activeView === 'examenes-practicos'
      ? 'w-full h-screen overflow-hidden'
      : 'flex-1 p-6 sm:p-8 overflow-y-auto bg-gray-50';

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
             <ToastContainer toasts={toasts} />
             <Suspense fallback={<div></div>}>
                {!(isFocusMode && activeView === 'examenes-practicos') && <Sidebar activeView={activeView} setActiveView={setActiveView} />}
             </Suspense>
            <div className="flex-1 flex flex-col overflow-hidden">
                 <Suspense fallback={<div></div>}>
                    {!(isFocusMode && activeView === 'examenes-practicos') && <Header />}
                 </Suspense>
                <main className={mainContentClass}>
                    <Suspense fallback={<LoadingFallback />}>
                        {renderView()}
                    </Suspense>
                </main>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    return (
        <AppProvider>
            <AppContent />
        </AppProvider>
    );
};


export default App;