import React, { useEffect, useState } from 'react';
import { checkAnkiConnection } from '../services/ankiService';

const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const probe = async () => {
      const ok = await checkAnkiConnection();
      if (!isCancelled) setIsConnected(ok);
    };

    // Initial probe
    probe();
    // Re-probe periodically while app is open
    const intervalId = window.setInterval(probe, 5000);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  if (isConnected === null) {
    return (
      <div className="banner info">
        <i className="fas fa-spinner fa-spin"></i>
        <span>Checking Anki connection...</span>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="banner warning">
        <i className="fas fa-circle-exclamation"></i>
        <span>You are not connected to Anki</span>
        <i className="fas fa-circle-info"></i>
      </div>
    );
  }

  return (
    <div className="banner success">
      <i className="fas fa-check-circle"></i>
      <span>Connected to Anki</span>
    </div>
  );
};

export { ConnectionStatus };
