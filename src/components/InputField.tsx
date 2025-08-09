import React, { useEffect, useRef, useState } from 'react';

interface InputFieldProps {
  label: string;
  icon: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  textarea?: boolean;
  rows?: number;
  rightIcon?: string;
  /** Optional content to render on the right side of the label row (e.g. CREATE/SEARCH action). */
  labelRight?: React.ReactNode;
  /** Optional trailing icon inside the input/textarea (Font Awesome classes). */
  trailingIcon?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  icon,
  value,
  onChange,
  placeholder = '',
  required = false,
  textarea = false,
  rows = 4,
  rightIcon,
  labelRight,
  trailingIcon,
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isMultiline, setIsMultiline] = useState(false);

  const autoResize = () => {
    const el = textAreaRef.current;
    if (!el) return;
    // Prevent scrollbars and size exactly to content
    el.style.overflowY = 'hidden';
    el.style.height = '0px';
    el.style.height = `${el.scrollHeight}px`;
    // Consider it multiline if it exceeds a single-line baseline (~56px)
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
      // reflow height and focus
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
        {labelRight && (
          <div className="label-action">{labelRight}</div>
        )}
      </div>

      <div className={rightIcon && !textarea ? 'control has-icons-right' : 'control'}>
        {textarea ? (
          <div className={`pill-input${isMultiline ? ' multiline' : ''}`}>
            <textarea
              className="textarea"
              ref={textAreaRef}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              rows={rows}
              required={required}
              style={{ height: 'auto', overflow: 'hidden' }}
            />
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
            {trailingIcon && (
              <span className="icon trailing"><i className={trailingIcon}></i></span>
            )}
          </div>
        ) : (
          <div className="pill-input">
            <input
              className="input"
              type="text"
              ref={inputRef}
              value={value}
              onChange={handleChange}
              placeholder={placeholder}
              required={required}
            />
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
            {(trailingIcon || rightIcon) && (
              <span className="icon trailing"><i className={trailingIcon || rightIcon!}></i></span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export { InputField };
