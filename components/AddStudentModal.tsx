import React, { useState } from 'react';
import { Student } from '../types';
import { XIcon, SaveIcon } from './icons';

interface AddStudentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (studentData: Omit<Student, 'id' | 'fotoUrl'>) => void;
}

const InputField: React.FC<{ 
    label: string, 
    name: string, 
    value: string, 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
    required?: boolean, 
    type?: string 
}> = ({ label, name, value, onChange, required = false, type = 'text' }) => {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                required={required}
                className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
        </div>
    );
};

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        nre: '',
        expediente: '',
        nombre: '',
        apellido1: '',
        apellido2: '',
        grupo: '',
        subgrupo: '',
        fechaNacimiento: '',
        telefono: '',
        emailPersonal: '',
        emailOficial: '',
    });

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.nombre || !formData.apellido1 || !formData.nre) {
            alert('Nombre, Primer Apellido y NRE son campos obligatorios.');
            return;
        }
        onSave(formData);
        onClose();
        // Reset form for next time
        setFormData({
            nre: '', expediente: '', nombre: '', apellido1: '', apellido2: '',
            grupo: '', subgrupo: '', fechaNacimiento: '', telefono: '',
            emailPersonal: '', emailOficial: '',
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="add-student-title" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                    <h3 id="add-student-title" className="text-xl font-bold text-gray-800">Añadir Nuevo Alumno</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XIcon className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField label="Nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
                        <InputField label="Primer Apellido" name="apellido1" value={formData.apellido1} onChange={handleChange} required />
                        <InputField label="Segundo Apellido" name="apellido2" value={formData.apellido2} onChange={handleChange} />
                        <InputField label="NRE" name="nre" value={formData.nre} onChange={handleChange} required />
                        <InputField label="Nº Expediente" name="expediente" value={formData.expediente} onChange={handleChange} />
                        <InputField label="Grupo" name="grupo" value={formData.grupo} onChange={handleChange} />
                        <InputField label="Subgrupo" name="subgrupo" value={formData.subgrupo} onChange={handleChange} />
                        <InputField label="Fecha de Nacimiento" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} type="date" />
                        <InputField label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} />
                        <InputField label="Email Personal" name="emailPersonal" value={formData.emailPersonal} onChange={handleChange} type="email" />
                        <InputField label="Email Oficial" name="emailOficial" value={formData.emailOficial} onChange={handleChange} type="email" />
                    </div>
                </form>
                <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-semibold">
                        Cancelar
                    </button>
                    <button type="button" onClick={() => handleSubmit()} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-semibold flex items-center">
                        <SaveIcon className="w-5 h-5 mr-2" />
                        Guardar Alumno
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddStudentModal;