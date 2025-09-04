'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import ChatSystem from '@/components/ChatSystem';
import { ref, onValue, query, orderByChild } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { Chat } from '@/types/Pet';

export default function ChatsPage() {
  const { user, userProfile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const chatsRef = ref(realtimeDb, 'chats');
    const chatsQuery = query(chatsRef, orderByChild('lastMessageTime'));

    const unsubscribe = onValue(chatsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chatsList = Object.entries(data)
          .map(([key, value]: [string, any]) => ({
            id: key,
            ...value,
            lastMessageTime: new Date(value.lastMessageTime),
          }))
          .filter((chat: Chat) => chat.participants.includes(user.uid))
          .reverse();
        
        setChats(chatsList);
      } else {
        setChats([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getOtherParticipantName = (chat: Chat) => {
    const otherParticipantId = chat.participants.find(id => id !== user?.uid);
    return chat.participantNames[otherParticipantId || ''] || 'Unknown User';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign in to view chats</h2>
            <p className="text-gray-600 mb-4">
              You need to be logged in to access your conversations.
            </p>
            <Button className="bg-teal-600 hover:bg-teal-700">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Your Conversations
          </h1>
          <p className="text-xl text-gray-600">
            Connect with other pet lovers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat List */}
          <div className={`lg:col-span-1 ${selectedChat ? 'hidden lg:block' : ''}`}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Messages</CardTitle>
              </CardHeader>
              <CardContent>
                {chats.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No conversations yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedChat?.id === chat.id
                            ? 'bg-teal-100 border-teal-200'
                            : 'hover:bg-gray-50 border-transparent'
                        } border`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-800">
                              {getOtherParticipantName(chat)}
                            </h3>
                            {chat.petName && (
                              <p className="text-sm text-teal-600 mb-1">
                                About: {chat.petName}
                              </p>
                            )}
                            <p className="text-sm text-gray-600 truncate">
                              {chat.lastMessage}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {chat.lastMessageTime.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className={`lg:col-span-2 ${!selectedChat ? 'hidden lg:block' : ''}`}>
            {selectedChat ? (
              <ChatSystem
                chatId={selectedChat.id}
                recipientName={getOtherParticipantName(selectedChat)}
                onBack={() => setSelectedChat(null)}
              />
            ) : (
              <Card className="h-96">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-600">
                      Choose a chat from the list to start messaging
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}