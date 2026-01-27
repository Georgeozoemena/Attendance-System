import React from 'react';

export default function FieldInput({ value, onChange, onBlur, placeholder }) {
  return (
    <input
      className="input"
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
    />
  );
}