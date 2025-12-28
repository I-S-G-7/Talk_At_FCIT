import { useState, useRef, useEffect } from 'react';
import { messaging, users } from '../services/api';
import { getTimeAgo, getInitials, type User } from '../data/mockData';
import './Messages.css';

interface MessagesProps {
    onNavigate: (page: string) => void;
    currentUser: User | null;
}

const Messages = ({ onNavigate, currentUser }: MessagesProps) => {
    const [conversations, setConversations] = useState<any[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<any | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // New Message State
    const [isNewMessageMode, setIsNewMessageMode] = useState(false);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userSearchResults, setUserSearchResults] = useState<any[]>([]);

    // Fetch conversations on mount
    useEffect(() => {
        setLoading(true);
        messaging.listConversations()
            .then(res => {
                const results = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
                setConversations(results);
            })
            .catch(err => console.error("Failed to load conversations", err))
            .finally(() => setLoading(false));
    }, []);

    // Search users for new message
    useEffect(() => {
        if (!isNewMessageMode || !userSearchQuery.trim()) {
            setUserSearchResults([]);
            return;
        }
        const timer = setTimeout(() => {
            users.search(userSearchQuery).then(res => {
                setUserSearchResults(res.data.results || []);
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [userSearchQuery, isNewMessageMode]);

    // Fetch detailed conversation when selected (includes messages)
    useEffect(() => {
        if (selectedConversation?.id) {
            messaging.getConversation(selectedConversation.id)
                .then(res => {
                    // API returns detail with messages
                    setSelectedConversation(res.data);
                    // Also update list to mark as read locally?
                    // Verify if list needs update.
                })
                .catch(err => console.error("Failed to load conversation details", err));
        }
    }, [selectedConversation?.id]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConversation?.messages]);

    if (!currentUser) {
        return (
            <div className="messages-page">
                <div className="login-required glass">
                    <span className="icon">💬</span>
                    <h2>Login Required</h2>
                    <p>Please log in to access your messages</p>
                    <button className="login-btn" onClick={() => onNavigate('login')}>
                        Login
                    </button>
                </div>
            </div>
        );
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            const res = await messaging.sendMessage({
                conversation_id: selectedConversation.id,
                content: newMessage
            });

            // Append message to current view
            const message = res.data;
            // The API returns the message object. 
            // We need to shape it if necessary, but assuming it matches expectations.
            // Our backend returns PrivateMessageSerializer.

            // Manually update UI for immediate feedback
            const updatedConv = {
                ...selectedConversation,
                messages: [...(selectedConversation.messages || []), message]
            };
            setSelectedConversation(updatedConv);
            setNewMessage('');

            // Refresh list to show latest message preview
            messaging.listConversations().then(r => {
                setConversations(Array.isArray(r.data) ? r.data : (r.data as any).results || []);
            });

        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    const handleStartNewChat = async (targetUser: any) => {
        try {
            const res = await messaging.startConversation(targetUser.id);
            const conv = res.data;
            if (!conversations.find(c => c.id === conv.id)) {
                setConversations([conv, ...conversations]);
            }
            setSelectedConversation(conv);
            setIsNewMessageMode(false);
            setUserSearchQuery('');
        } catch (err) {
            console.error("Failed to start conversation", err);
            // alert("Could not start conversation");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Filter logic needs to adapt to API data shape.
    // Backend conversation has 'participants' array.
    // We need to find "other" participant.
    const getOtherParticipant = (conv: any) => {
        // Assuming current user is in participants, find the other one.
        if (!conv.participants) return null;
        return conv.participants.find((p: any) => p.id !== currentUser.id);
    };

    const filteredConversations = conversations.filter(conv => {
        const other = getOtherParticipant(conv);
        if (!other) return false;
        const fullName = `${other.first_name} ${other.last_name}`.toLowerCase();
        return fullName.includes(searchQuery.toLowerCase());
    });

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

    return (
        <div className="messages-page">
            <div className="messages-container glass">
                <div className="conversations-sidebar">
                    <div className="sidebar-header">
                        <h2>Messages</h2>
                        <button className="new-msg-btn" onClick={() => setIsNewMessageMode(!isNewMessageMode)}>
                            {isNewMessageMode ? '✕' : '➕'}
                        </button>
                    </div>

                    {isNewMessageMode ? (
                        <div className="new-message-search">
                            <input
                                autoFocus
                                type="text"
                                placeholder="Search user to chat..."
                                value={userSearchQuery}
                                onChange={(e) => setUserSearchQuery(e.target.value)}
                                className="user-search-input"
                            />
                            <div className="user-results">
                                {userSearchResults.map(user => (
                                    <div key={user.id} className="user-result-item" onClick={() => handleStartNewChat(user)}>
                                        <div className="avatar-small">{getInitials(user.full_name || user.email, '')}</div>
                                        <span>{user.full_name || user.email}</span>
                                    </div>
                                ))}
                                {userSearchQuery && userSearchResults.length === 0 && (
                                    <div className="no-results">No users found</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="search-box">
                                <span className="search-icon">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="conversations-list">
                                {filteredConversations.map(conv => {
                                    const other = getOtherParticipant(conv);
                                    if (!other) return null;
                                    return (
                                        <div
                                            key={conv.id}
                                            className={`conversation-item ${selectedConversation?.id === conv.id ? 'active' : ''}`}
                                            onClick={() => setSelectedConversation(conv)}
                                        >
                                            <div className="conv-avatar">
                                                {getInitials(other.first_name, other.last_name)}
                                            </div>
                                            <div className="conv-info">
                                                <div className="conv-name-row">
                                                    <span className="conv-name">
                                                        {other.first_name} {other.last_name}
                                                    </span>
                                                </div>
                                                <p className="conv-preview">
                                                    {/* Preview last message if available */}
                                                    {conv.last_message_preview || "Click to view"}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredConversations.length === 0 && !loading && (
                                    <div className="no-conversations">
                                        <p>No conversations found</p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="chat-area">
                    {selectedConversation ? (
                        <>
                            <div className="chat-header">
                                {(() => {
                                    const other = getOtherParticipant(selectedConversation);
                                    if (!other) return null;
                                    return (
                                        <div className="chat-user-info">
                                            <h3>{other.first_name} {other.last_name}</h3>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="messages-area">
                                {(selectedConversation.messages || []).map((msg: any) => (
                                    <div
                                        key={msg.id}
                                        className={`message ${msg.sender.id === currentUser.id ? 'sent' : 'received'}`}
                                    >
                                        <div className="message-content">
                                            <p>{msg.content}</p>
                                            <span className="message-time">
                                                {getTimeAgo(msg.created_at)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="message-input-area">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type a message..."
                                    rows={1}
                                />
                                <button className="send-btn" onClick={handleSendMessage}>➤</button>
                            </div>
                        </>
                    ) : (
                        <div className="no-chat-selected">
                            <p>Select a conversation</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default Messages;
