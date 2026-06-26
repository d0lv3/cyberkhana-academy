import React from 'react';

interface BilingualInputProps {
  labelEn?: string;
  labelAr?: string;
  valueEn: string;
  valueAr: string;
  onChangeEn: (value: string) => void;
  onChangeAr: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
}

const BilingualInput: React.FC<BilingualInputProps> = ({
  labelEn = 'English',
  labelAr = 'العربية',
  valueEn,
  valueAr,
  onChangeEn,
  onChangeAr,
  placeholder = '',
  multiline = false,
  required = false,
}) => {
  const inputClasses =
    'w-full bg-[#0a0f18] border border-[#263248] rounded-lg px-3 py-2 text-sm text-[#d2d7e3] focus:outline-none focus:border-[#00a859]/50 transition-colors placeholder:text-[#3d4a63]';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* English */}
      <div>
        <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">
          {labelEn} {required && <span className="text-[#00a859]">*</span>}
        </label>
        {multiline ? (
          <textarea
            value={valueEn}
            onChange={(e) => onChangeEn(e.target.value)}
            placeholder={placeholder}
            className={`${inputClasses} min-h-[80px] resize-y`}
            dir="ltr"
            required={required}
          />
        ) : (
          <input
            type="text"
            value={valueEn}
            onChange={(e) => onChangeEn(e.target.value)}
            placeholder={placeholder}
            className={inputClasses}
            dir="ltr"
            required={required}
          />
        )}
      </div>

      {/* Arabic */}
      <div>
        <label className="block text-xs font-semibold text-[#9aa5bf] mb-1.5">
          {labelAr} {required && <span className="text-[#00a859]">*</span>}
        </label>
        {multiline ? (
          <textarea
            value={valueAr}
            onChange={(e) => onChangeAr(e.target.value)}
            placeholder={placeholder}
            className={`${inputClasses} min-h-[80px] resize-y`}
            dir="rtl"
            required={required}
          />
        ) : (
          <input
            type="text"
            value={valueAr}
            onChange={(e) => onChangeAr(e.target.value)}
            placeholder={placeholder}
            className={inputClasses}
            dir="rtl"
            required={required}
          />
        )}
      </div>
    </div>
  );
};

export default BilingualInput;
