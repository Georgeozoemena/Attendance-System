import React from 'react';

export default function SubmitButton({ disabled, loading, label }) {
  return (
    <button type="submit" disabled={disabled} className="submit-btn">
      {loading ? 'Submitting...' : label}
    </button>
  );
}