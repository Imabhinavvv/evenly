import * as React from 'react';
import { cn } from '../../utils/cn';

const FloatingInput = React.forwardRef(({ className, label, id, ...props }, ref) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div className={cn('evenly-field', className)}>
      <input
        ref={ref}
        id={inputId}
        className="evenly-field-input"
        placeholder=" "
        {...props}
      />
      <label htmlFor={inputId} className="evenly-field-label">
        {label}
      </label>
    </div>
  );
});
FloatingInput.displayName = 'FloatingInput';

export { FloatingInput };
