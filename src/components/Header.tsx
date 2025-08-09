import React from 'react';

interface HeaderProps {
  title?: string;
  onOpenSettings?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = 'Card Creator', onOpenSettings }) => {
  return (
    <header className="app-header">
      <div className="left-icons">
        <button className="icon-button" onClick={onOpenSettings}><i className="fas fa-cog"></i></button>
        <button className="icon-button"><i className="fas fa-clock"></i></button>
      </div>
      <div className="title">{title}</div>
      <div className="right-fab">
        <button className="fab-button"><i className="fas fa-wand-magic-sparkles"></i></button>
      </div>
    </header>
  );
};

export { Header };
