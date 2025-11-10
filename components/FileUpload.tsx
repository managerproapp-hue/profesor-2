import React, { useRef, useState } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onFileUpload(event.target.files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };


  return (
    <div>
        <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300
            ${disabled ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed' : 
            isDragging ? 'border-blue-500 bg-blue-50 dark:bg-gray-700' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon className={`w-10 h-10 mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                <p className={`mb-2 text-sm text-center ${isDragging ? 'text-blue-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Solo archivos Excel (.xls, .xlsx)</p>
            </div>
            <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange} 
                ref={fileInputRef}
                disabled={disabled}
            />
        </label>
    </div>
  );
};

export default FileUpload;