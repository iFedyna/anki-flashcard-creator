import React, { useEffect, useRef, useState } from 'react';

interface FieldWithButtonProps {
  label: string;
  icon: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
  rows?: number;
  buttonLabel: string;
  buttonIcon?: string;
  onButtonClick: () => void;
}

const FieldWithButton: React.FC<FieldWithButtonProps> = ({
  label,
  icon,
  value,
  onChange,
  placeholder = '',
  textarea = false,
  rows = 3,
  buttonLabel,
  buttonIcon = 'fas fa-wand-magic-sparkles',
  onButtonClick,
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isMultiline, setIsMultiline] = useState(false);

  const autoResize = () => {
    const el = textAreaRef.current;
    if (!el) return;
    el.style.overflowY = 'hidden';
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
    setIsMultiline(el.scrollHeight > 64);
  };

  useEffect(() => {
    if (textarea) autoResize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, textarea]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
    if (textarea) autoResize();
  };

  const clearValue = () => {
    onChange('');
    if (textarea) {
      requestAnimationFrame(() => {
        autoResize();
        textAreaRef.current?.focus();
      });
    } else {
      inputRef.current?.focus();
    }
  };

  return (
    <div className="field">
      <div className="label-row">
        <label className="label">
          <span className="icon"><i className={icon}></i></span>
          {label}
        </label>
        <button type="button" className="label-link" onClick={onButtonClick}>
          <span>{buttonLabel}</span>
          <i className={buttonIcon}></i>
        </button>
      </div>
      <div className="control">
        <div className={`pill-input${isMultiline ? ' multiline' : ''}`}>
          {textarea ? (
            <textarea
              className="textarea"
              ref={textAreaRef}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              rows={rows}
              style={{ height: 'auto', overflow: 'hidden' }}
            />
          ) : (
            <input
              className="input"
              type="text"
              ref={inputRef}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
            />
          )}
          {value && (
            <button
              type="button"
              className="clear-btn"
              aria-label="Clear"
              onClick={clearValue}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
          <span className="icon trailing"><i className="fas fa-clipboard"></i></span>
        </div>
      </div>
    </div>
  );
};

export { FieldWithButton };
