
import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import StudentList from '../components/StudentList';
import StudentTable from '../components/StudentTable';
import FileUpload from '../components/FileUpload';
import { ListIcon, GridIcon, SearchIcon, UserPlusIcon, FileSpreadsheetIcon } from '../components/icons';

interface AlumnosProps {
  students: Student[];
  onViewStudent: (student: Student) => void;
  handleFileUpload: (file: File) => void;
  error: string | null;
  loading: boolean;
}

const Alumnos: React.FC<AlumnosProps> = ({ students, onViewStudent, handleFileUpload, error, loading }) => {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const fullName = `${student.nombre} ${student.apellido1} ${student.apellido2}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) || 
             student.nre.toLowerCase().includes(searchTerm.toLowerCase()) ||
             student.grupo.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [students, searchTerm]);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Alumnos</h1>
        <p className="text-gray-500 mt-1">Busca, visualiza y gestiona la información de tus alumnos.</p>
      </header>

      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-grow sm:flex-grow-0 sm:w-72">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
            placeholder="Buscar por nombre, NRE, grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
           <button className="flex items-center bg-green-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-600 transition text-sm">
            <UserPlusIcon className="w-5 h-5 mr-1" />
            Nuevo Alumno
          </button>
           
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow' : 'text-gray-500 hover:bg-white/60'}`}
              aria-label="Grid View"
            >
              <GridIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow' : 'text-gray-500 hover:bg-white/60'}`}
              aria-label="Table View"
            >
              <ListIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {students.length === 0 && (
          <div className="mt-8">
            <h3 className="text-center text-xl font-semibold text-gray-600 mb-4">No hay datos de alumnos.</h3>
            <p className="text-center text-gray-500 mb-6">Sube un archivo Excel para empezar a gestionar a tus estudiantes.</p>
            <div className="max-w-xl mx-auto">
                <FileUpload onFileUpload={handleFileUpload} disabled={loading} />
                {loading && <p className="text-center mt-4 text-blue-500">Procesando archivo...</p>}
                {error && <p className="text-center mt-4 text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
            </div>
          </div>
      )}

      {students.length > 0 && (
        viewMode === 'grid' ? (
          <StudentList students={filteredStudents} onViewStudent={onViewStudent} />
        ) : (
          <StudentTable students={filteredStudents} onViewStudent={onViewStudent} />
        )
      )}
    </div>
  );
};

export default Alumnos;
