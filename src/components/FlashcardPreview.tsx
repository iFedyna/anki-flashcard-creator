import React from 'react';

interface FlashcardPreviewProps {
  front: string;
  back: string;
}

const FlashcardPreview: React.FC<FlashcardPreviewProps> = ({ front, back }) => {
  return (
    <div className="flashcard-preview">
      <h3 className="title is-5">
        <span className="icon"><i className="fas fa-eye"></i></span>
        Flashcard Preview
      </h3>
      <div className="box">
        <div className="content">
          <div className="flashcard-front">
            <strong>Front:</strong>
            <div>{front || '(empty)'}</div>
          </div>
          <div className="flashcard-back">
            <strong>Back:</strong>
            <div>{back || '(empty)'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { FlashcardPreview };
