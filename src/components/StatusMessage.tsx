import React from 'react';

interface StatusMessageProps {
  message: string;
  type: string;
  visible: boolean;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ message, type, visible }) => {
  if (!visible) return null;

  const bulmaType = type === 'success' 
    ? 'success' 
    : type === 'error' 
      ? 'danger' 
      : 'info';

  return (
    <div className={`notification is-${bulmaType}`}>
      {message}
    </div>
  );
};

export { StatusMessage };
