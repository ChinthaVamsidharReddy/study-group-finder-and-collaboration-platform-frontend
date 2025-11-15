// import React, { createContext, useContext, useReducer, useEffect } from 'react';
// import { toast } from 'react-toastify';

// // TODO: Replace with environment variable
// const API_BASE = "http://localhost:8080/api";

// // Notification types
// export const NOTIFICATION_TYPES = {
//   SESSION_REMINDER: 'session_reminder',
//   SESSION_CREATED: 'session_created',
//   SESSION_UPDATED: 'session_updated',
//   SESSION_CANCELLED: 'session_cancelled',
//   SESSION_CONFIRMED: 'session_confirmed',
//   POLL_CREATED: 'poll_created',
//   POLL_CLOSED: 'poll_closed',
//   GROUP_INVITATION: 'group_invitation',
//   GROUP_JOINED: 'group_joined',
//   MESSAGE: 'message'
// };

// // Initial state
// const initialState = {
//   notifications: [],
//   preferences: {
//     emailNotifications: true,
//     pushNotifications: true,
//     sessionReminders: true,
//     groupUpdates: true,
//     reminderTimes: [30, 15, 5] // minutes before session
//   },
//   loading: false,
//   error: null
// };

// // Action types
// const actionTypes = {
//   SET_LOADING: 'SET_LOADING',
//   SET_ERROR: 'SET_ERROR',
//   SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
//   ADD_NOTIFICATION: 'ADD_NOTIFICATION',
//   UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
//   REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
//   MARK_AS_READ: 'MARK_AS_READ',
//   SET_PREFERENCES: 'SET_PREFERENCES'
// };

// // Reducer
// function notificationReducer(state, action) {
//   switch (action.type) {
//     case actionTypes.SET_LOADING:
//       return { ...state, loading: action.payload };
    
//     case actionTypes.SET_ERROR:
//       return { ...state, error: action.payload, loading: false };
    
//     case actionTypes.SET_NOTIFICATIONS:
//       return { ...state, notifications: action.payload, loading: false };
    
//     case actionTypes.ADD_NOTIFICATION:
//       return { 
//         ...state, 
//         notifications: [action.payload, ...state.notifications] 
//       };
    
//     case actionTypes.UPDATE_NOTIFICATION:
//       return {
//         ...state,
//         notifications: state.notifications.map(notification =>
//           notification.id === action.payload.id ? action.payload : notification
//         )
//       };
    
//     case actionTypes.REMOVE_NOTIFICATION:
//       return {
//         ...state,
//         notifications: state.notifications.filter(notification => 
//           notification.id !== action.payload
//         )
//       };
    
//     case actionTypes.MARK_AS_READ:
//       return {
//         ...state,
//         notifications: state.notifications.map(notification =>
//           notification.id === action.payload 
//             ? { ...notification, read: true }
//             : notification
//         )
//       };
    
//     case actionTypes.SET_PREFERENCES:
//       return { ...state, preferences: { ...state.preferences, ...action.payload } };
    
//     default:
//       return state;
//   }
// }

// // Context
// const NotificationContext = createContext();

// // Provider component
// export const NotificationProvider = ({ children }) => {
//   const [state, dispatch] = useReducer(notificationReducer, initialState);
//   const token = localStorage.getItem('token');
//   const userId = localStorage.getItem('userId');

//   // Request browser notification permission
//   useEffect(() => {
//     if ('Notification' in window && Notification.permission === 'default') {
//       Notification.requestPermission();
//     }
//   }, []);

//   // Load user notifications on mount
//   useEffect(() => {
//     if (userId && token) {
//       loadNotifications();
//       loadNotificationPreferences();
//     }
//   }, [userId, token]);

//   // Load notifications from backend
//   const loadNotifications = async () => {
//     if (!userId || !token) return;
    
//     dispatch({ type: actionTypes.SET_LOADING, payload: true });
//     try {
//       // TODO: API Integration - Fetch user notifications
//       // Backend endpoint: GET /api/notifications/user/{userId}
//       // Headers: Authorization: Bearer {token}
//       const response = await fetch(`${API_BASE}/notifications/user/${userId}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const notifications = await response.json();
//         dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: notifications || [] });
//       } else {
//         throw new Error('Failed to load notifications');
//       }
//     } catch (error) {
//       console.error('Error loading notifications:', error);
//       dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
//       // Set empty array as fallback
//       dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: [] });
//     }
//   };

//   // Load notification preferences
//   const loadNotificationPreferences = async () => {
//     try {
//       // TODO: API Integration - Fetch user notification preferences
//       // Backend endpoint: GET /api/users/{userId}/notification-preferences
//       // Headers: Authorization: Bearer {token}
//       const response = await fetch(`${API_BASE}/users/${userId}/notification-preferences`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         const preferences = await response.json();
//         dispatch({ type: actionTypes.SET_PREFERENCES, payload: preferences });
//       }
//     } catch (error) {
//       console.error('Error loading notification preferences:', error);
//     }
//   };

//   // Create notification
//   const createNotification = async (notificationData) => {
//     try {
//       // TODO: API Integration - Create notification
//       // Backend endpoint: POST /api/notifications
//       // Headers: Authorization: Bearer {token}, Content-Type: application/json
//       // Body: notificationData
//       const response = await fetch(`${API_BASE}/notifications`, {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           ...notificationData,
//           userId: parseInt(userId),
//           createdAt: new Date().toISOString()
//         })
//       });

//       if (response.ok) {
//         const newNotification = await response.json();
//         dispatch({ type: actionTypes.ADD_NOTIFICATION, payload: newNotification });
        
//         // Show browser notification if enabled
//         if (state.preferences.pushNotifications && 'Notification' in window && Notification.permission === 'granted') {
//           showBrowserNotification(newNotification);
//         }
        
//         // Show toast notification
//         showToastNotification(newNotification);
        
//         return newNotification;
//       }
//     } catch (error) {
//       console.error('Error creating notification:', error);
//     }
//   };

//   // Show browser notification
//   const showBrowserNotification = (notification) => {
//     if ('Notification' in window && Notification.permission === 'granted') {
//       const browserNotification = new Notification(notification.title, {
//         body: notification.message,
//         icon: '/favicon.ico',
//         tag: notification.id
//       });

//       // Auto close after 5 seconds
//       setTimeout(() => {
//         browserNotification.close();
//       }, 5000);
//     }
//   };

//   // Show toast notification
//   const showToastNotification = (notification) => {
//     const toastType = notification.type === NOTIFICATION_TYPES.SESSION_REMINDER ? 'warning' : 'info';
    
//     toast[toastType](notification.message, {
//       position: 'top-right',
//       autoClose: 5000,
//       hideProgressBar: false,
//       closeOnClick: true,
//       pauseOnHover: true,
//       draggable: true,
//     });
//   };

//   // Schedule session reminders
//   const scheduleSessionReminders = (session) => {
//     if (!session.startTime || !state.preferences.sessionReminders) return;

//     const startTime = new Date(session.startTime);
//     const now = new Date();
    
//     state.preferences.reminderTimes.forEach(minutes => {
//       const reminderTime = new Date(startTime.getTime() - (minutes * 60 * 1000));
//       const delay = reminderTime.getTime() - now.getTime();
      
//       if (delay > 0 && delay < 7 * 24 * 60 * 60 * 1000) { // Within 7 days
//         setTimeout(() => {
//           createNotification({
//             type: NOTIFICATION_TYPES.SESSION_REMINDER,
//             title: 'Session Reminder',
//             message: `"${session.title}" starts in ${minutes} minutes`,
//             sessionId: session.id,
//             groupId: session.groupId,
//             read: false
//           });
//         }, delay);
//       }
//     });
//   };

//   // Mark notification as read
//   const markAsRead = async (notificationId) => {
//     try {
//       // TODO: API Integration - Mark notification as read
//       // Backend endpoint: PATCH /api/notifications/{notificationId}/read
//       // Headers: Authorization: Bearer {token}
//       const response = await fetch(`${API_BASE}/notifications/${notificationId}/read`, {
//         method: 'PATCH',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         dispatch({ type: actionTypes.MARK_AS_READ, payload: notificationId });
//       }
//     } catch (error) {
//       console.error('Error marking notification as read:', error);
//     }
//   };

//   // Delete notification
//   const deleteNotification = async (notificationId) => {
//     try {
//       // TODO: API Integration - Delete notification
//       // Backend endpoint: DELETE /api/notifications/{notificationId}
//       // Headers: Authorization: Bearer {token}
//       const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
//         method: 'DELETE',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.ok) {
//         dispatch({ type: actionTypes.REMOVE_NOTIFICATION, payload: notificationId });
//       }
//     } catch (error) {
//       console.error('Error deleting notification:', error);
//     }
//   };

//   // Update notification preferences
//   const updatePreferences = async (newPreferences) => {
//     try {
//       // TODO: API Integration - Update notification preferences
//       // Backend endpoint: PUT /api/users/{userId}/notification-preferences
//       // Headers: Authorization: Bearer {token}, Content-Type: application/json
//       // Body: newPreferences
//       const response = await fetch(`${API_BASE}/users/${userId}/notification-preferences`, {
//         method: 'PUT',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(newPreferences)
//       });

//       if (response.ok) {
//         dispatch({ type: actionTypes.SET_PREFERENCES, payload: newPreferences });
//         toast.success('Notification preferences updated');
//       }
//     } catch (error) {
//       console.error('Error updating notification preferences:', error);
//       toast.error('Failed to update preferences');
//     }
//   };

//   // Get unread notification count
//   const getUnreadCount = () => {
//     return state.notifications.filter(notification => !notification.read).length;
//   };

//   const value = {
//     ...state,
//     loadNotifications,
//     createNotification,
//     markAsRead,
//     deleteNotification,
//     updatePreferences,
//     scheduleSessionReminders,
//     getUnreadCount,
//     showBrowserNotification,
//     showToastNotification
//   };

//   return (
//     <NotificationContext.Provider value={value}>
//       {children}
//     </NotificationContext.Provider>
//   );
// };

// // Hook to use notification context
// export const useNotifications = () => {
//   const context = useContext(NotificationContext);
//   if (context === undefined) {
//     throw new Error('useNotifications must be used within a NotificationProvider');
//   }
//   return context;
// };

// export default NotificationContext;




// it works for all subscription of the group


// src/contexts/NotificationContext.js
// import React, { createContext, useContext, useEffect, useState } from "react";
// import { getStompClient } from "../utils/stompClient";

// const NotificationContext = createContext();
// export const useNotifications = () => useContext(NotificationContext);

// export const NotificationProvider = ({ children }) => {
//   const [notifications, setNotifications] = useState([]);
//   const token = localStorage.getItem("token");
//   const userId = localStorage.getItem("userId");

//   // ✅ Fetch user's groups once after login
//   useEffect(() => {
//     if (!userId || !token) return;

//     const stompClient = getStompClient(token);

//     fetch(`http://localhost:8080/api/groups/joined/${userId}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     })
//       .then((res) => res.json())
//       .then((groups) => {
//         console.log("Subscribing to groups:", groups);
//         groups.forEach((group) => {
//           const topic = `/topic/group.${group.id}`;
//           stompClient.subscribe(topic, (msg) => {
//             const payload = JSON.parse(msg.body);
//             handleIncomingNotification(payload);
//           });
//         });
//       })
//       .catch((err) => console.error("Error fetching user groups:", err));
//   }, [userId, token]);

//   // ✅ Handle incoming WebSocket messages
//   const handleIncomingNotification = (payload) => {
//     console.log("🔔 Notification received:", payload);

//     const type = payload.type?.toLowerCase();

//     if (type === "reminder") {
//       showBrowserNotification(
//         `⏰ ${payload.title}`,
//         `Your session starts in ${payload.minutesBefore} minutes`
//       );
//     } else if (type === "created") {
//       showBrowserNotification(
//         `📅 New Session Created`,
//         `${payload.title} has been scheduled`
//       );
//     } else if (type === "rsvp") {
//       showBrowserNotification(
//         `📢 RSVP Update`,
//         `${payload.title} got a new RSVP`
//       );
//     }

//     // Also store in app state
//     setNotifications((prev) => [
//       { id: Date.now(), ...payload },
//       ...prev.slice(0, 50),
//     ]);
//   };

//   // ✅ Browser Notification API
//   const showBrowserNotification = (title, message) => {
//     if (Notification.permission === "granted") {
//       const n = new Notification(title, {
//         body: message,
//         icon: "/logo192.png",
//       });
//       n.onclick = () => window.focus();
//     } else if (Notification.permission !== "denied") {
//       Notification.requestPermission().then((perm) => {
//         if (perm === "granted") showBrowserNotification(title, message);
//       });
//     }
//   };

//   return (
//     <NotificationContext.Provider value={{ notifications }}>
//       {children}
//     </NotificationContext.Provider>
//   );
// };







import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { getStompClient } from "../utils/stompClient";

const NotificationContext = createContext();
export const useNotifications = () => useContext(NotificationContext);

const shownNotifications = new Set(); // Prevent duplicate popups

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const subscribedGroupsRef = useRef(new Set()); // Track active subscriptions

  useEffect(() => {
    if (!userId || !token) return;
    const stompClient = getStompClient(token);

    fetch(`http://localhost:8080/api/groups/joined/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((groups) => {
        console.log("✅ Groups fetched:", groups);

        groups.forEach((group) => {
          const topic = `/topic/group.${group.id}`;
          if (subscribedGroupsRef.current.has(topic)) return; // 🧠 Already subscribed

          subscribedGroupsRef.current.add(topic);
          console.log("🔗 Subscribing to:", topic);

          stompClient.subscribe(topic, (msg) => {
            const payload = JSON.parse(msg.body);
            handleIncomingNotification(payload);
          });
        });
      })
      .catch((err) => console.error("Error fetching user groups:", err));
  }, [userId, token]);

  const handleIncomingNotification = (payload) => {
    console.log("🔔 Notification received:", payload);

    const key = `${payload.type}-${payload.sessionId}-${payload.minutesBefore}`;
    if (shownNotifications.has(key)) {
      console.log("🚫 Duplicate notification ignored:", key);
      return;
    }
    shownNotifications.add(key);
    setTimeout(() => shownNotifications.delete(key), 60000); // Clear after 1 min

    const type = payload.type?.toLowerCase();
    if (type === "reminder") {
      showBrowserNotification(
        `⏰ ${payload.title}`,
        `Your session starts in ${payload.minutesBefore} minutes`
      );
    } else if (type === "created") {
      showBrowserNotification(
        `📅 New Session Created`,
        `${payload.title} has been scheduled`
      );
    } else if (type === "rsvp") {
      showBrowserNotification(
        `📢 RSVP Update`,
        `${payload.title} got a new RSVP`
      );
    }

    setNotifications((prev) => [
      { id: Date.now(), ...payload },
      ...prev.slice(0, 50),
    ]);
  };

  const showBrowserNotification = (title, message) => {
    if (Notification.permission === "granted") {
      const n = new Notification(title, {
        body: message,
        icon: "/logo192.png",
      });
      n.onclick = () => window.focus();
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") showBrowserNotification(title, message);
      });
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications }}>
      {children}
    </NotificationContext.Provider>
  );
};
