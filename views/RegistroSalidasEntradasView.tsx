import React, { useState, useMemo } from 'react';
import { ArrowLeftOnRectangleIcon, ArrowRightOnRectangleIcon, SearchIcon, SaveIcon, PrinterIcon } from '../components/icons';
import { useAppContext } from '../context/AppContext';
import { generateEntryExitSheetPDF } from '../services/reportGenerator';

const RegistroSalidasEntradasView: React.FC = () => {
  const { students, handleSaveEntryExitRecord, teacherData, instituteData } = useAppContext();
  
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [recordType, setRecordType] = useState<'Salida Anticipada' | 'Llegada Tarde'>('Salida Anticipada');
  const [reason, setReason] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const fullName = `${student.nombre} ${student.apellido1} ${student.apellido2}`.toLowerCase();
      return fullName.includes(searchTerm.toLowerCase());
    }).sort((a,b) => a.apellido1.localeCompare(b.apellido1));
  }, [students, searchTerm]);
  
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };
  
  const handleSave = () => {
    if (selectedStudents.size === 0) {
      alert('Por favor, selecciona al menos un alumno.');
      return;
    }
    if (!reason.trim()) {
      alert('Por favor, introduce un motivo.');
      return;
    }

    handleSaveEntryExitRecord({
      date: new Date(recordDate).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit'}),
      type: recordType,
      reason: reason.trim(),
    }, Array.from(selectedStudents));

    setSelectedStudents(new Set());
    setReason('');
  };

  const handlePrintSheet = () => {
    generateEntryExitSheetPDF(students, teacherData, instituteData);
  };

  return (
    <div>
      <header className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Registro de Salidas y Entradas</h1>
          <p className="text-gray-500 mt-1">Registra las salidas anticipadas o llegadas tarde de los alumnos.</p>
        </div>
        <button 
          onClick={handlePrintSheet} 
          className="flex items-center bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition text-sm"
          title="Imprimir hoja de registro en papel"
        >
          <PrinterIcon className="w-5 h-5 mr-2" />
          Imprimir Hoja de Registro
        </button>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                  <label htmlFor="record-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha del registro</label>
                  <input type="date" id="record-date" value={recordDate} onChange={e => setRecordDate(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"/>
              </div>
              <div>
                  <label htmlFor="search-student" className="block text-sm font-medium text-gray-700 mb-1">Buscar alumno</label>
                  <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <SearchIcon className="w-5 h-5 text-gray-400" />
                      </div>
                      <input type="text" id="search-student" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5" placeholder="Filtrar por nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
              </div>
          </div>
          <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-2">
            {filteredStudents.map(student => (
              <div key={student.id} onClick={() => handleStudentSelect(student.id)} className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors border-2 ${selectedStudents.has(student.id) ? 'bg-blue-100 border-blue-400' : 'bg-gray-50 border-transparent hover:bg-gray-100'}`}>
                <img src={student.fotoUrl} alt="" className="w-10 h-10 rounded-full object-cover mr-4"/>
                <div>
                  <p className="font-semibold text-gray-800">{`${student.apellido1} ${student.apellido2}, ${student.nombre}`}</p>
                  <p className="text-xs text-gray-500">{student.grupo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm self-start">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Detalles del Registro</h2>
          <div className="mb-6">
            <p className="block text-sm font-medium text-gray-700 mb-2">Tipo de Registro</p>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setRecordType('Salida Anticipada')} className={`flex items-center justify-center p-3 text-sm font-semibold rounded-lg border-2 transition-all ${recordType === 'Salida Anticipada' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}><ArrowRightOnRectangleIcon className="w-5 h-5 mr-2" />Salida Anticipada</button>
                <button onClick={() => setRecordType('Llegada Tarde')} className={`flex items-center justify-center p-3 text-sm font-semibold rounded-lg border-2 transition-all ${recordType === 'Llegada Tarde' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}><ArrowLeftOnRectangleIcon className="w-5 h-5 mr-2" />Llegada Tarde</button>
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Motivo / Hora</label>
            <textarea id="reason" rows={4} value={reason} onChange={e => setReason(e.target.value)} className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5" placeholder="Ej. Cita médica a las 14:30h"></textarea>
          </div>
          <div className="mb-8">
             <h3 className="text-sm font-medium text-gray-700 mb-2">Alumnos Seleccionados ({selectedStudents.size})</h3>
             {selectedStudents.size === 0 ? (<p className="text-sm text-gray-500">Selecciona alumnos de la lista de la izquierda.</p>) : (<div className="text-sm text-gray-800 max-h-24 overflow-y-auto">{students.filter(s => selectedStudents.has(s.id)).map(s => <p key={s.id}>- {`${s.apellido1} ${s.apellido2}, ${s.nombre}`}</p>)}</div>)}
          </div>
          <button onClick={handleSave} className="w-full flex items-center justify-center bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition"><SaveIcon className="w-5 h-5 mr-2" />Guardar Registro</button>
        </div>
      </div>
    </div>
  );
};

export default RegistroSalidasEntradasView;
