import React from 'react';
import { Student } from '../types';

interface StudentCardProps {
  student: Student;
  onViewStudent: (student: Student) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({ student, onViewStudent }) => {
  const fullName = `${student.nombre} ${student.apellido1} ${student.apellido2}`.trim();

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer flex flex-col"
      onClick={() => onViewStudent(student)}
    >
      <img className="w-full h-28 object-cover object-center" src={student.fotoUrl} alt={`Photo of ${fullName}`} />
      <div className="p-4 flex flex-col flex-grow justify-center">
        <h3 className="text-base font-bold text-gray-800 dark:text-white truncate" title={fullName}>{fullName}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{`Grupo: ${student.grupo} - ${student.subgrupo}`}</p>
      </div>
    </div>
  );
};

export default StudentCard;