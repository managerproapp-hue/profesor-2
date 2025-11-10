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
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 ease-in-out cursor-pointer"
      onClick={() => onViewStudent(student)}
    >
      <img className="w-full h-48 object-cover object-center" src={student.fotoUrl} alt={`Photo of ${fullName}`} />
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate" title={fullName}>{fullName}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{`Grupo: ${student.grupo} - ${student.subgrupo}`}</p>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-2">
                 <EmailIcon />
                <span className="truncate" title={student.emailOficial}>{student.emailOficial}</span>
            </div>
             <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <PhoneIcon />
                <span className="truncate">{student.telefono}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCard;