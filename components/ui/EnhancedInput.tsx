import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className = '', ...props }, ref) => {
    const inputClasses = [
      'w-full bg-[#1a2332] border border-[#263248] rounded-lg',
      'text-[#f3f6ff] placeholder-[#6e7a94]',
      'focus:outline-none focus:ring-2 focus:ring-[#00a859] focus:border-[#00a859]',
      'transition-all duration-200 py-2.5',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      leftIcon ? 'pl-10' : 'pl-4',
      rightIcon ? 'pr-10' : 'pr-4',
      error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#d2d7e3] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input ref={ref} className={inputClasses} {...props} />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-[#6e7a94]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
