import React from 'react';

interface ActionButtonsProps {
  onClear: () => void;
  isLoading: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onClear, isLoading }) => {
  return (
    <div className="footer-actions">
      <button
        type="button"
        className="button pill ghost"
        onClick={onClear}
      >
        <span className="icon"><i className="fas fa-eraser"></i></span>
        <span>CLEAR FIELDS</span>
      </button>
      <button
        type="submit"
        className="button pill gradient"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span className="loading-spinner"></span>
            <span>CREATING...</span>
          </>
        ) : (
          <>
            <span className="icon"><i className="fas fa-paper-plane"></i></span>
            <span>CREATE CARD</span>
          </>
        )}
      </button>
    </div>
  );
};

export { ActionButtons };
