import { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../services/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setPermission(permission);
        });
      }
    }
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);

      // Show browser notification for new unread notifications
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const notif = { id: change.doc.id, ...change.doc.data() };
          if (!notif.read && permission === 'granted') {
            showBrowserNotification(notif);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [permission]);

  const showBrowserNotification = (notif) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(notif.title, {
        body: notif.message,
        icon: '/favicon.svg',
        badge: '/favicon.svg'
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  const createNotification = async (userId, type, data) => {
    try {
      let title = '';
      let message = '';

      switch (type) {
        case 'mention':
          title = 'Someone mentioned you';
          message = `${data.userName} mentioned you in a discussion`;
          break;
        case 'comment':
          title = 'New comment';
          message = `${data.userName} commented on your discussion`;
          break;
        case 'reaction':
          title = 'New reaction';
          message = `${data.userName} reacted to your discussion`;
          break;
        case 'water':
          title = 'Idea watered!';
          message = `${data.userName} watered your idea`;
          break;
        default:
          title = 'New notification';
          message = data.message;
      }

      await addDoc(collection(db, 'notifications'), {
        userId,
        type,
        title,
        message,
        read: false,
        createdAt: serverTimestamp(),
        data
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifs.map(n =>
          updateDoc(doc(db, 'notifications', n.id), { read: true })
        )
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const value = {
    notifications,
    unreadCount,
    createNotification,
    markAsRead,
    markAllAsRead,
    permission
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
