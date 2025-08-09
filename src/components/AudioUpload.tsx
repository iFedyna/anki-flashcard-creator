import React from 'react';

interface AudioUploadProps {
  label: string;
  icon: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

const AudioUpload: React.FC<AudioUploadProps> = ({
  label,
  icon,
  file,
  onChange
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    onChange(selectedFile);
  };

  const fileName = file ? file.name : 'Choose audio file';

  return (
    <div className="field">
      <label className="label">
        <span className="icon"><i className={icon}></i></span>
        {label}
      </label>
      <div className="control">
        <div className="file is-boxed is-fullwidth">
          <label className="file-label">
            <input 
              className="file-input" 
              type="file" 
              accept="audio/*"
              onChange={handleChange}
            />
            <span className="file-cta">
              <span className="file-icon">
                <i className="fas fa-upload"></i>
              </span>
              <span className="file-label">
                {fileName}
              </span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};

export { AudioUpload };
