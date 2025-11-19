import { useEffect, useState } from 'react';
import { socket, connectionStatus } from '@/socket';
import styles from './index.module.css';

const ConnectionStatus = () => {
  const [status, setStatus] = useState(connectionStatus);

  useEffect(() => {
    const updateStatus = () => {
      setStatus({ ...connectionStatus });
    };

    socket.on('connect', updateStatus);
    socket.on('disconnect', updateStatus);
    socket.on('connect_error', updateStatus);
    socket.on('reconnect', updateStatus);
    socket.on('reconnect_attempt', updateStatus);
    socket.on('reconnect_error', updateStatus);
    socket.on('reconnect_failed', updateStatus);

    return () => {
      socket.off('connect', updateStatus);
      socket.off('disconnect', updateStatus);
      socket.off('connect_error', updateStatus);
      socket.off('reconnect', updateStatus);
      socket.off('reconnect_attempt', updateStatus);
      socket.off('reconnect_error', updateStatus);
      socket.off('reconnect_failed', updateStatus);
    };
  }, []);

  if (status.connected) {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.statusIndicator} style={{ backgroundColor: '#4ade80' }}></div>
        <span className={styles.statusText}>Connected</span>
      </div>
    );
  }

  if (status.connecting) {
    return (
      <div className={styles.statusContainer}>
        <div className={styles.statusIndicator} style={{ backgroundColor: '#fbbf24' }}></div>
        <span className={styles.statusText}>Connecting...</span>
      </div>
    );
  }

  return (
    <div className={styles.statusContainer}>
      <div className={styles.statusIndicator} style={{ backgroundColor: '#ef4444' }}></div>
      <span className={styles.statusText}>Disconnected</span>
    </div>
  );
};

export default ConnectionStatus;

