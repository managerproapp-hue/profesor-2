
import React from 'react';
import { Student } from '../types';
import StudentCard from './StudentCard';

interface StudentListProps {
  students: Student[];
  onViewStudent: (student: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onViewStudent }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {students.map((student) => (
        <StudentCard key={student.id} student={student} onViewStudent={onViewStudent} />
      ))}
    </div>
  );
};

export default StudentList;