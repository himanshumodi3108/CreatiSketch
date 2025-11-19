import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRoom, setUserCount } from '@/slice/menuSlice';
import { socket } from '@/socket';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faDoorOpen, faPlus } from '@fortawesome/free-solid-svg-icons';
import styles from './index.module.css';

const RoomManager = () => {
  const dispatch = useDispatch();
  const { currentRoom, userCount } = useSelector((state) => state.menu);
  const [showRoomList, setShowRoomList] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');

  useEffect(() => {
    const handleRoomsList = (data) => {
      setRooms(data.rooms || []);
    };

    const handleRoomJoined = (data) => {
      dispatch(setRoom(data.roomId));
      dispatch(setUserCount(data.userCount));
    };

    const handleUserJoined = (data) => {
      dispatch(setUserCount(data.userCount));
    };

    const handleUserLeft = (data) => {
      dispatch(setUserCount(data.userCount));
    };

    socket.on('roomsList', handleRoomsList);
    socket.on('roomJoined', handleRoomJoined);
    socket.on('userJoined', handleUserJoined);
    socket.on('userLeft', handleUserLeft);

    socket.emit('getRooms');

    return () => {
      socket.off('roomsList', handleRoomsList);
      socket.off('roomJoined', handleRoomJoined);
      socket.off('userJoined', handleUserJoined);
      socket.off('userLeft', handleUserLeft);
    };
  }, [dispatch]);

  const handleJoinRoom = (roomId) => {
    socket.emit('joinRoom', { roomId, create: false });
    setShowRoomList(false);
  };

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      socket.emit('joinRoom', { roomId: newRoomName.trim(), create: true });
      setNewRoomName('');
      setShowRoomList(false);
    }
  };

  const handleLeaveRoom = () => {
    if (currentRoom !== 'default') {
      socket.emit('leaveRoom');
    }
  };

  // Ensure consistent rendering on server and client
  // Use default values if not yet initialized
  const displayRoom = currentRoom || 'default'
  const displayUserCount = userCount || 0

  return (
    <div className={styles.roomManagerContainer}>
      <div className={styles.roomInfo} onClick={() => setShowRoomList(!showRoomList)}>
        <FontAwesomeIcon icon={faUsers} className={styles.icon} />
        <span className={styles.roomName}>{displayRoom}</span>
        <span className={styles.userCount}>({displayUserCount})</span>
      </div>

      {showRoomList && (
        <div className={styles.roomList}>
          <div className={styles.roomListHeader}>
            <h4>Rooms</h4>
            <button onClick={() => setShowRoomList(false)} className={styles.closeBtn}>×</button>
          </div>

          <div className={styles.createRoom}>
            <input
              type="text"
              placeholder="New room name"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
              className={styles.roomInput}
            />
            <button onClick={handleCreateRoom} className={styles.createBtn}>
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>

          <div className={styles.roomsList}>
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`${styles.roomItem} ${room.id === currentRoom ? styles.active : ''}`}
                onClick={() => room.id !== currentRoom && handleJoinRoom(room.id)}
              >
                <span>{room.id}</span>
                <span className={styles.roomUserCount}>({room.userCount})</span>
              </div>
            ))}
          </div>

          {currentRoom !== 'default' && (
            <button onClick={handleLeaveRoom} className={styles.leaveBtn}>
              <FontAwesomeIcon icon={faDoorOpen} />
              Leave Room
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default RoomManager;

