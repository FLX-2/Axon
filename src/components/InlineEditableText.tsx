import React, { useState, useEffect, useRef } from 'react';

interface InlineEditableTextProps {
  value: string;
  onSave: (newValue: string) => void;
  onCancel?: () => void;
  isEditing: boolean;
  className?: string;
  placeholder?: string;
  maxLength?: number;
}

export const InlineEditableText: React.FC<InlineEditableTextProps> = ({
  value,
  onSave,
  onCancel,
  isEditing,
  className = '',
  placeholder = '',
  maxLength = 50
}) => {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      setEditValue(value);
      // Focus and select all text when editing starts
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 0);
    }
  }, [isEditing, value]);

  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== value) {
      onSave(trimmedValue);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (onCancel) {
        onCancel();
      }
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={maxLength}
        className={`
          bg-inputBg border border-accent rounded px-2 py-1 text-sm
          text-textPrimary placeholder-textSecondary
          focus:outline-none focus:ring-1 focus:ring-accent
          w-full text-center
          ${className}
        `}
        onClick={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span className={className}>
      {value}
    </span>
  );
};