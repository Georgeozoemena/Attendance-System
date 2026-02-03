import React from 'react';

export default function FieldInput({ value, onChange, onBlur, placeholder, ...props }) {
  return (
    <input
      className="input"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      {...props}
    />
  );
}