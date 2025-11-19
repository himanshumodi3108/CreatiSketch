import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUserName } from '@/slice/menuSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit } from '@fortawesome/free-solid-svg-icons';
import styles from './index.module.css';

const UserName = () => {
  const dispatch = useDispatch();
  const { userName } = useSelector((state) => state.menu);
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(userName);
  const [isClient, setIsClient] = useState(false);

  // Update tempName when userName changes
  useEffect(() => {
    if (userName) {
      setTempName(userName);
    }
  }, [userName]);

  // Load username from localStorage on client side only
  useEffect(() => {
    setIsClient(true);
    if (!userName) {
      const stored = localStorage.getItem('creatisketch_username');
      if (stored) {
        dispatch(setUserName(stored));
      } else {
        // Generate random username only if none exists
        const randomName = `User${Math.floor(Math.random() * 1000)}`;
        dispatch(setUserName(randomName));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleSave = () => {
    if (tempName.trim()) {
      dispatch(setUserName(tempName.trim()));
    } else {
      setTempName(userName);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempName(userName);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={styles.userNameContainer}>
        <input
          type="text"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          onBlur={handleSave}
          autoFocus
          className={styles.nameInput}
          maxLength={20}
        />
      </div>
    );
  }

  // Don't render until client-side hydration is complete
  if (!isClient || !userName) {
    return (
      <div className={styles.userNameContainer}>
        <FontAwesomeIcon icon={faUser} className={styles.icon} />
        <span className={styles.userName}>Loading...</span>
      </div>
    );
  }

  return (
    <div className={styles.userNameContainer} onClick={() => setIsEditing(true)}>
      <FontAwesomeIcon icon={faUser} className={styles.icon} />
      <span className={styles.userName}>{userName}</span>
      <FontAwesomeIcon icon={faEdit} className={styles.editIcon} />
    </div>
  );
};

export default UserName;

