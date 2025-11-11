import React from 'react';
import { Student } from '../types';
import { EmailIcon, PhoneIcon } from './icons';

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
      <div className="p-2 flex flex-col flex-grow">
        <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate" title={fullName}>{fullName}</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400">{`Grupo: ${student.grupo} - ${student.subgrupo}`}</p>
        
        <div className="mt-auto pt-1 border-t border-gray-200 dark:border-gray-700 space-y-1 mt-1">
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                 <EmailIcon className="flex-shrink-0" />
                <span className="truncate" title={student.emailOficial}>{student.emailOficial}</span>
            </div>
             <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                <PhoneIcon className="flex-shrink-0" />
                <span className="truncate">{student.telefono}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCard;