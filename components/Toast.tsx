import React, { useState, useEffect } from 'react';
import { Toast, ToastType } from '../types';
import { InfoIcon, SaveIcon, XIcon } from './icons'; // Assuming SaveIcon for success, InfoIcon for others

interface ToastProps {
  toast: Toast;
}

const ToastComponent: React.FC<ToastProps> = ({ toast }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  
  const ICONS: Record<ToastType, React.ReactElement> = {
    success: <SaveIcon className="w-5 h-5 text-green-500" />,
    error: <XIcon className="w-5 h-5 text-red-500" />,
    info: <InfoIcon className="w-5 h-5 text-blue-500" />,
  };

  const BORDER_COLORS: Record<ToastType, string> = {
      success: 'border-green-500',
      error: 'border-red-500',
      info: 'border-blue-500'
  }

  return (
    <div
      className={`
        w-full max-w-sm bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden
        border-l-4 ${BORDER_COLORS[toast.type]}
        transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{ICONS[toast.type]}</div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium text-gray-900">{toast.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};


interface ToastContainerProps {
    toasts: Toast[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {toasts.map((toast) => (
                    <ToastComponent key={toast.id} toast={toast} />
                ))}
            </div>
        </div>
    );
};
