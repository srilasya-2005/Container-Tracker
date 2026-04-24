import React from 'react';

const InputField = ({
  label,
  error,
  hint,
  required,
  as = 'input',
  className = '',
  inputClassName = '',
  rightSlot,
  leftSlot,
  ...props
}) => {
  const Component = as;
  const baseInputClasses =
    'w-full rounded-lg border bg-white px-4 py-2 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 ' +
    'focus:border-orange-500 transition disabled:opacity-60 disabled:cursor-not-allowed';
  const errorClasses = error ? 'border-red-400 focus:ring-red-500 focus:border-red-500' : 'border-slate-300';

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label}
          {required && <span className="text-orange-600"> *</span>}
        </label>
      )}
      <div className="relative">
        {leftSlot && <div className="absolute inset-y-0 left-3 flex items-center text-slate-400">{leftSlot}</div>}
        <Component className={`${baseInputClasses} ${errorClasses} ${inputClassName}`.trim()} {...props} />
        {rightSlot && <div className="absolute inset-y-0 right-3 flex items-center">{rightSlot}</div>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!error && hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
};

export default InputField;
