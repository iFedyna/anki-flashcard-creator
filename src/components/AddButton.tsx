import React from 'react';

interface AddButtonProps {
  label: string;
  onClick: () => void;
}

const AddButton: React.FC<AddButtonProps> = ({ label, onClick }) => {
  return (
    <button 
      className="button is-link is-outlined is-fullwidth"
      onClick={onClick}
    >
      <span className="icon"><i className="fas fa-plus"></i></span>
      <span>+ {label}</span>
    </button>
  );
};

export { AddButton };
