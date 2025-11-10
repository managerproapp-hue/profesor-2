import React from 'react';
import { Student } from '../types';

interface StudentTableProps {
  students: Student[];
  onViewStudent: (student: Student) => void;
}

const StudentTable: React.FC<StudentTableProps> = ({ students, onViewStudent }) => {
  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-500">
          <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
            <tr>
              <th scope="col" className="px-6 py-3">#</th>
              <th scope="col" className="px-6 py-3">Nombre Completo</th>
              <th scope="col" className="px-6 py-3">NRE</th>
              <th scope="col" className="px-6 py-3">Grupo</th>
              <th scope="col" className="px-6 py-3">Email</th>
              <th scope="col" className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, index) => {
              const fullName = `${student.apellido1} ${student.apellido2}, ${student.nombre}`.trim();
              return (
                <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    <div className="flex items-center">
                      <img 
                        className="w-8 h-8 rounded-full object-cover mr-3" 
                        src={student.fotoUrl} 
                        alt={`Foto de ${fullName}`} 
                      />
                      {fullName}
                    </div>
                  </td>
                  <td className="px-6 py-4">{student.nre}</td>
                  <td className="px-6 py-4">{student.grupo}</td>
                  <td className="px-6 py-4">{student.emailOficial}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a href="#" onClick={(e) => { e.preventDefault(); onViewStudent(student); }} className="font-medium text-green-600 hover:underline mr-4">Ver</a>
                    <a href="#" className="font-medium text-blue-600 hover:underline mr-4">Editar</a>
                    <a href="#" className="font-medium text-red-600 hover:underline">Eliminar</a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;