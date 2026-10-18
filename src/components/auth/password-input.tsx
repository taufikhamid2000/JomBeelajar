'use client';

import { useState } from 'react';

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path
        d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.35 5.42A10.6 10.6 0 0 1 12 5c7 0 10.5 7 10.5 7a13.1 13.1 0 0 1-3.14 3.9M6.5 6.66C3.44 8.5 1.5 12 1.5 12s3.5 7 10.5 7a10.6 10.6 0 0 0 4.24-.87"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Each instance keeps its own show/hide state — the login field and the
// confirm-password field never share one flag (see JomBeelajar auth-page
// history: previously the plain <input> markup was hand-duplicated per
// field, which is exactly the kind of copy-paste that risks one shared
// `showPassword` flag controlling both fields).
export function PasswordInput({
  id,
  name,
  placeholder,
  required,
  autoComplete,
  value,
  onChange,
  showLabel = 'Show password',
  hideLabel = 'Hide password',
  className,
  ariaInvalid,
  ariaDescribedBy,
}: {
  id?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  showLabel?: string;
  hideLabel?: string;
  className: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        className={`w-full pr-10 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? hideLabel : showLabel}
        className="absolute inset-y-0 right-0 flex cursor-pointer items-center px-3 text-foreground/50 transition-colors hover:text-foreground"
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
