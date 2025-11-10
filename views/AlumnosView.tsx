import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import StudentList from '../components/StudentList';
import StudentTable from '../components/StudentTable';
import FileUpload from '../components/FileUpload';
import FichaAlumno from './FichaAlumno'; 
import AddStudentModal from '../components/AddStudentModal';
import { ListIcon, GridIcon, SearchIcon, UserPlusIcon } from '../components/icons';
import { useAppContext } from '../context/AppContext';

const AlumnosView: React.FC = () => {
  const { students, setStudents, entryExitRecords, calculatedStudentGrades, academicGrades, courseGrades, handleFileUpload: contextHandleFileUpload, addToast, handleUpdateStudent } = useAppContext();
  
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    await contextHandleFileUpload(file);
    setLoading(false);
  };

  const filteredStudents = useMemo(() => {
    if (!searchTerm) {
      return students;
    }
    return students.filter(student => {
      const fullName = `${student.nombre} ${student.apellido1} ${student.apellido2}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase()) || 
             student.nre.toLowerCase().includes(searchTerm.toLowerCase()) ||
             student.grupo.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [students, searchTerm]);

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
  };
  
  const handleUpdatePhoto = (studentId: string, photoUrl: string) => {
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, fotoUrl: photoUrl } : s));
      if (selectedStudent?.id === studentId) {
          setSelectedStudent(prev => prev ? { ...prev, fotoUrl: photoUrl } : null);
      }
      addToast('Foto del alumno actualizada.', 'success');
  };

  const handleSaveNewStudent = (newStudentData: Omit<Student, 'id' | 'fotoUrl'>) => {
    const newStudent: Student = {
        ...newStudentData,
        id: `${newStudentData.nre}-${Date.now()}`,
        fotoUrl: `https://picsum.photos/seed/${newStudentData.nre || Date.now()}/200`,
    };
    setStudents(prev => [...prev, newStudent].sort((a,b) => a.apellido1.localeCompare(b.apellido1)));
    addToast('Alumno añadido con éxito.', 'success');
  };

  const handleSaveStudent = (updatedStudent: Student) => {
    handleUpdateStudent(updatedStudent);
    setSelectedStudent(updatedStudent);
  };
  
  if (selectedStudent) {
      return <FichaAlumno 
          student={selectedStudent} 
          onBack={handleBackToList}
          entryExitRecords={entryExitRecords.filter(r => r.studentId === selectedStudent.id)}
          calculatedGrades={calculatedStudentGrades[selectedStudent.id]}
          academicGrades={academicGrades[selectedStudent.id]}
          courseGrades={courseGrades[selectedStudent.id]}
          onUpdatePhoto={handleUpdatePhoto}
          onUpdateStudent={handleSaveStudent}
       />;
  }

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
           <button 
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center bg-green-500 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-600 transition text-sm">
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
            </div>
          </div>
      )}

      {students.length > 0 && filteredStudents.length === 0 && (
        <div className="text-center py-10">
            <p className="text-lg text-gray-600">No se encontraron alumnos con el criterio de búsqueda.</p>
        </div>
      )}

      {students.length > 0 && filteredStudents.length > 0 && (
        viewMode === 'grid' ? (
          <StudentList students={filteredStudents} onViewStudent={handleViewStudent} />
        ) : (
          <StudentTable students={filteredStudents} onViewStudent={handleViewStudent} />
        )
      )}
      <AddStudentModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewStudent}
      />
    </div>
  );
};

export default AlumnosView;