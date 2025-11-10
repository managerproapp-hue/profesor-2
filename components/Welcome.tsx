import React from 'react';
import { ChefHatIcon } from './icons';

interface WelcomeProps {
  onStart: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center p-4">
      <div className="max-w-2xl">
        <ChefHatIcon className="mx-auto h-20 w-20 text-blue-500 mb-6" />
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 dark:text-white mb-4">
          Bienvenido al Gestor de Estudiantes Culinarios
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Esta aplicación está diseñada para facilitar la gestión de los alumnos del módulo de <span className="font-semibold text-blue-500">Productos Culinarios</span>. Sube un archivo Excel con los datos de tus estudiantes para comenzar.
        </p>
        <button
          onClick={onStart}
          className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full hover:bg-blue-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 shadow-lg"
        >
          Empezar a Gestionar
        </button>
      </div>
       <footer className="absolute bottom-4 text-gray-500 dark:text-gray-400 text-sm">
        <p>Desarrollado para una gestión académica eficiente. Preparado para Vercel.</p>
      </footer>
    </div>
  );
};

export default Welcome;