import { useState, useRef, useEffect } from 'react';
import { messaging } from '../services/api';
import { type User } from '../data/mockData';
import './Chat.css';

interface ChatProps {
    onNavigate: (page: string) => void;
    currentUser: User | null;
}

const Chat = ({ onNavigate, currentUser }: ChatProps) => {
    const [rooms, setRooms] = useState<any[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<any | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch rooms
    useEffect(() => {
        messaging.listChatRooms()
            .then(res => {
                const results = Array.isArray(res.data) ? res.data : (res.data as any).results || [];
                setRooms(results);
                // Auto select first room if exists
                if (results.length > 0) setSelectedRoom(results[0]);
            })
            .catch(err => console.error("Failed to load chat rooms", err));
    }, []);

    // Fetch messages for selected room
    useEffect(() => {
        if (selectedRoom) {
            messaging.getChatRoomMessages(selectedRoom.id)
                .then(res => setMessages(res.data))
                .catch(err => console.error("Failed to load room messages", err));

            // Poll for messages
            const interval = setInterval(() => {
                messaging.getChatRoomMessages(selectedRoom.id)
                    .then(res => setMessages(res.data))
                    .catch(e => console.error("Poll failed", e));
            }, 5000); // 5s poll

            return () => clearInterval(interval);
        }
    }, [selectedRoom]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!currentUser) {
        return (
            <div className="chat-page">
                <div className="login-required glass">
                    <span className="icon">🗨️</span>
                    <h2>Login Required</h2>
                    <p>Please log in to join the chat</p>
                    <button className="login-btn" onClick={() => onNavigate('login')}>
                        Login
                    </button>
                </div>
            </div>
        );
    }

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedRoom) return;

        try {
            await messaging.sendChatRoomMessage(selectedRoom.id, newMessage);
            setNewMessage('');
            // Immediate refresh
            const res = await messaging.getChatRoomMessages(selectedRoom.id);
            setMessages(res.data);
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="chat-page">
            <div className="chat-container glass">
                <div className="main-chat">
                    {/* Rooms List / Header */}
                    <div className="chat-header">
                        <div className="room-info">
                            {selectedRoom ? (
                                <>
                                    <h2>🗨️ {selectedRoom.name}</h2>
                                    <span className="room-description">{selectedRoom.description}</span>
                                </>
                            ) : (
                                <h2>Select a Room</h2>
                            )}
                        </div>
                        {rooms.length > 1 && (
                            <div className="room-select">
                                <select
                                    value={selectedRoom?.id || ''}
                                    onChange={(e) => {
                                        const room = rooms.find(r => r.id === parseInt(e.target.value));
                                        if (room) setSelectedRoom(room);
                                    }}
                                >
                                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg: any) => (
                            <div
                                key={msg.id}
                                className={`chat-message ${msg.sender.id === currentUser.id ? 'own' : 'other'}`}
                            >
                                {msg.sender.id !== currentUser.id && (
                                    <div className="message-sender-name">
                                        {msg.sender.first_name}
                                    </div>
                                )}
                                <div className="message-bubble">
                                    <p className="message-text">{msg.content}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            rows={1}
                            disabled={!selectedRoom}
                        />
                        <button
                            className="send-btn"
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || !selectedRoom}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
