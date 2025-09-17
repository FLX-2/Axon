import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, X } from 'lucide-react';

interface HotkeyInputProps {
  value: string | null;
  onChange: (hotkey: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const HotkeyInput: React.FC<HotkeyInputProps> = ({
  value,
  onChange,
  placeholder = "Press keys to set hotkey...",
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatHotkey = (keys: string[]): string => {
    // Convert recorded keys to Tauri accelerator format
    const modifiers: string[] = [];
    let mainKey = '';

    keys.forEach(key => {
      switch (key.toLowerCase()) {
        case 'control':
        case 'ctrl':
          if (!modifiers.includes('Ctrl')) modifiers.push('Ctrl');
          break;
        case 'alt':
          if (!modifiers.includes('Alt')) modifiers.push('Alt');
          break;
        case 'shift':
          if (!modifiers.includes('Shift')) modifiers.push('Shift');
          break;
        default:
          if (!mainKey) {
            // Convert special keys
            switch (key.toLowerCase()) {
              case ' ':
                mainKey = 'Space';
                break;
              case 'arrowup':
                mainKey = 'ArrowUp';
                break;
              case 'arrowdown':
                mainKey = 'ArrowDown';
                break;
              case 'arrowleft':
                mainKey = 'ArrowLeft';
                break;
              case 'arrowright':
                mainKey = 'ArrowRight';
                break;
              case 'enter':
                mainKey = 'Enter';
                break;
              case 'escape':
                mainKey = 'Escape';
                break;
              case 'backspace':
                mainKey = 'Backspace';
                break;
              case 'delete':
                mainKey = 'Delete';
                break;
              case 'tab':
                mainKey = 'Tab';
                break;
              default:
                mainKey = key.toUpperCase();
            }
          }
      }
    });

    if (modifiers.length > 0 && mainKey) {
      return [...modifiers, mainKey].join('+');
    }
    return '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    const keys: string[] = [];
    
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.altKey) keys.push('Alt');
    if (e.shiftKey) keys.push('Shift');
    
    // Add the main key if it's not a modifier
    if (!['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) {
      keys.push(e.key);
    }

    setRecordedKeys(keys);

    // If we have at least one modifier and a main key, finish recording
    if (keys.length >= 2 && !['Control', 'Meta', 'Alt', 'Shift'].includes(keys[keys.length - 1])) {
      const hotkey = formatHotkey(keys);
      if (hotkey) {
        onChange(hotkey);
        setIsRecording(false);
        setRecordedKeys([]);
        inputRef.current?.blur();
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (!isRecording) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const startRecording = () => {
    if (disabled) return;
    setIsRecording(true);
    setRecordedKeys([]);
    inputRef.current?.focus();
  };

  const stopRecording = () => {
    setIsRecording(false);
    setRecordedKeys([]);
    inputRef.current?.blur();
  };

  const clearHotkey = () => {
    onChange(null);
    stopRecording();
  };

  const displayValue = isRecording 
    ? (recordedKeys.length > 0 ? recordedKeys.join(' + ') : 'Recording...')
    : (value || '');

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={displayValue}
            placeholder={placeholder}
            readOnly
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onBlur={stopRecording}
            onClick={startRecording}
            className={`
              w-full px-3 py-2 pl-10 pr-10
              bg-inputBg border border-inputBorder rounded-lg
              text-textPrimary placeholder-textSecondary
              focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
              cursor-pointer
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              ${isRecording ? 'ring-2 ring-accent border-transparent' : ''}
            `}
            disabled={disabled}
          />
          
          <Keyboard className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-iconSecondary" />
          
          {value && !isRecording && (
            <button
              onClick={clearHotkey}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-iconSecondary hover:text-textPrimary transition-colors"
              title="Clear hotkey"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {isRecording && (
          <button
            onClick={stopRecording}
            className="px-3 py-2 text-sm bg-surfaceSecondary hover:bg-surfaceHover text-textSecondary rounded-lg transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
      
      {isRecording && (
        <p className="text-xs text-textSecondary mt-1">
          Press a combination of modifier keys (Ctrl, Alt, Shift) + a letter/number
        </p>
      )}
    </div>
  );
};