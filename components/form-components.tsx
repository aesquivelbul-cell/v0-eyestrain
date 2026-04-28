'use client';

import React from 'react';

interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
            error ? 'border-destructive focus:ring-destructive/50' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      </div>
    );
  }
);

InputField.displayName = 'InputField';

interface SelectFieldProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: Array<{ value: string; label: string }>;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, helperText, options, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
            error ? 'border-destructive focus:ring-destructive/50' : ''
          } ${className}`}
          {...props}
        >
          <option value="">Select an option</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';

interface TextAreaFieldProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none ${
            error ? 'border-destructive focus:ring-destructive/50' : ''
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
      </div>
    );
  }
);

TextAreaField.displayName = 'TextAreaField';

interface ToggleSwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export const ToggleSwitch = React.forwardRef<HTMLInputElement, ToggleSwitchProps>(
  ({ label, helperText, className = '', ...props }, ref) => {
    return (
      <div className="flex items-start gap-3">
        <div className="flex items-center h-6 mt-1">
          <input
            ref={ref}
            type="checkbox"
            className={`w-10 h-6 rounded-full border border-input bg-muted appearance-none cursor-pointer checked:bg-primary transition-colors ${className}`}
            {...props}
          />
        </div>
        <div className="flex flex-col gap-1">
          {label && (
            <label className="text-sm font-medium text-foreground cursor-pointer">
              {label}
            </label>
          )}
          {helperText && <p className="text-xs text-muted-foreground">{helperText}</p>}
        </div>
      </div>
    );
  }
);

ToggleSwitch.displayName = 'ToggleSwitch';

interface SliderFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  showValue?: boolean;
  unit?: string;
}

export const SliderField = React.forwardRef<HTMLInputElement, SliderFieldProps>(
  ({ label, showValue = true, unit = '', className = '', ...props }, ref) => {
    const [value, setValue] = React.useState(props.value || props.defaultValue || 0);

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {label && <label className="text-sm font-medium text-foreground">{label}</label>}
          {showValue && (
            <span className="text-sm font-semibold text-primary">
              {value} {unit}
            </span>
          )}
        </div>
        <input
          ref={ref}
          type="range"
          className={`w-full h-2 rounded-lg bg-muted appearance-none cursor-pointer accent-primary ${className}`}
          {...props}
          onChange={(e) => {
            setValue(e.target.value);
            props.onChange?.(e);
          }}
        />
      </div>
    );
  }
);

SliderField.displayName = 'SliderField';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      className = '',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
      primary:
        'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary/50',
      secondary:
        'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus:ring-secondary/50',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive/50',
      outline:
        'border border-border bg-background text-foreground hover:bg-muted focus:ring-primary/50',
      ghost:
        'text-foreground hover:bg-muted focus:ring-primary/50',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
            Loading...
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
