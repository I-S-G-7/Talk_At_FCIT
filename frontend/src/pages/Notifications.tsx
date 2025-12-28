import { useState, useEffect } from 'react';
import { notifications as notificationsApi } from '../services/api';
import { getTimeAgo } from '../data/mockData';
import './Notifications.css';



const Notifications = () => {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        notificationsApi.list()
            .then(res => {
                const results = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
                setNotifications(results);
            })
            .catch(err => console.error("Failed to fetch notifications", err));
    }, []);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const markAsRead = async (id: number) => {
        try {
            await notificationsApi.markRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationsApi.markAllRead();
            setNotifications(prev =>
                prev.map(n => ({ ...n, is_read: true }))
            );
        } catch (err) {
            console.error("Failed to mark all read", err);
        }
    };

    // Removed unused icon/color helpers as we simplified the UI

    return (
        <div className="notifications-page fade-in">
            <div className="notifications-header">
                <div className="header-title">
                    <h1>Notifications</h1>
                    {unreadCount > 0 && (
                        <span className="unread-badge">{unreadCount} new</span>
                    )}
                </div>
                <div className="header-actions">
                    {unreadCount > 0 && (
                        <button className="mark-all-btn" onClick={markAllAsRead}>
                            ✓ Mark all as read
                        </button>
                    )}
                </div>
            </div>

            <div className="notifications-list">
                {notifications.length > 0 ? (
                    notifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                            onClick={() => markAsRead(notification.id)}
                        >
                            <div className="notification-content">
                                <p>{notification.message}</p>
                                <span className="notification-time">{getTimeAgo(notification.created_at)}</span>
                            </div>
                            {!notification.is_read && <div className="unread-dot" />}
                        </div>
                    ))
                ) : (
                    <div className="empty-notifications">
                        <p>No notifications.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
