import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className={`bg-[#121a2a] border border-[#263248] rounded-lg shadow-xl w-full ${className || 'max-w-md'} animate-modal-enter relative`}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div className="flex justify-between items-center p-6 pb-0 mb-4">
            <h2 className="text-xl font-bold text-[#f3f6ff]">{title}</h2>
            <button onClick={onClose} className="text-[#6e7a94] hover:text-[#d2d7e3] transition-colors">
              <X size={24} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#6e7a94] hover:text-white transition-colors z-10"
          >
            <X size={24} />
          </button>
        )}
        <div className="p-6 pt-0">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
