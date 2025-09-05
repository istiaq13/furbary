'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Heart, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, push, onValue, query, orderByChild, set } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [contactName, setContactName] = useState('Unknown User');
  const [petName, setPetName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatId = params.chatId as string;

  useEffect(() => {
    // Test Firebase connection
    const testConnection = async () => {
      try {
        const connectedRef = ref(realtimeDb, '.info/connected');
        onValue(connectedRef, (snapshot) => {
          const connected = snapshot.val();
          console.log('Firebase Realtime Database connected:', connected);
          if (!connected) {
            toast.error('Database connection lost. Please check your internet connection.');
          }
        });
      } catch (error) {
        console.error('Firebase connection test failed:', error);
      }
    };

    testConnection();
  }, []);

  useEffect(() => {
    // Get contact info from URL params
    const contactNameParam = searchParams.get('contactName');
    const petNameParam = searchParams.get('petName');
    
    if (contactNameParam) {
      setContactName(decodeURIComponent(contactNameParam));
    }
    if (petNameParam) {
      setPetName(decodeURIComponent(petNameParam));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!chatId || !user) {
      console.log('Missing chatId or user:', { chatId, user: user?.uid });
      return;
    }

    console.log('Setting up message listener for chat:', chatId);
    console.log('Full path:', `chats/${chatId}/messages`);

    // Listen for messages in this chat
    const messagesRef = ref(realtimeDb, `chats/${chatId}/messages`);
    
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      console.log('Messages snapshot received:', snapshot.exists(), snapshot.val());
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Raw messages data:', data);
        
        // Convert to array and sort by timestamp
        const messagesList = Object.keys(data).map(key => ({
          id: key,
          senderId: data[key].senderId,
          senderName: data[key].senderName,
          message: data[key].message,
          timestamp: data[key].timestamp,
        })).sort((a, b) => a.timestamp - b.timestamp);
        
        console.log('Setting messages state:', messagesList);
        setMessages(messagesList);
      } else {
        console.log('No messages found, setting empty array');
        setMessages([]);
      }
    }, (error) => {
      console.error('Error listening to messages:', error);
      toast.error('Error loading messages');
    });

    return () => {
      console.log('Cleaning up message listener for chat:', chatId);
      unsubscribe();
    };
  }, [chatId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !userProfile || !user) {
      console.log('Cannot send message - missing data:', { newMessage: newMessage.trim(), userProfile, user });
      return;
    }

    const messageText = newMessage.trim();
    console.log('Attempting to send message:', messageText);

    // Clear input immediately for better UX
    setNewMessage('');

    // Create message object
    const messageData = {
      senderId: user.uid,
      senderName: userProfile.name,
      message: messageText,
      timestamp: Date.now(),
    };

    console.log('Message data to send:', messageData);

    try {
      // Add the message to the messages collection
      const messagesRef = ref(realtimeDb, `chats/${chatId}/messages`);
      const newMessageRef = push(messagesRef);
      await set(newMessageRef, messageData);
      
      console.log('Message sent successfully with ID:', newMessageRef.key);
      
      // Update only the chat metadata (not the entire chat which would overwrite messages)
      const chatMetaRef = ref(realtimeDb, `chats/${chatId}/metadata`);
      await set(chatMetaRef, {
        participants: chatId.split('_'),
        lastMessage: messageText,
        lastMessageTime: Date.now(),
        createdAt: Date.now(),
      });
      
      console.log('Chat metadata updated');
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Restore the message in input if sending failed
      setNewMessage(messageText);
      toast.error('Failed to send message. Please try again.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Please sign in</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to access chats.</p>
          <Button onClick={() => router.push('/auth')} className="bg-teal-600 hover:bg-teal-700">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/chats')}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            
            <div>
              <h2 className="font-semibold text-gray-900">{contactName}</h2>
              {petName && (
                <p className="text-sm text-teal-600 flex items-center">
                  <Heart className="h-3 w-3 mr-1" />
                  About {petName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium">Start of your conversation</p>
                <p className="text-sm">Say hello to {contactName}!</p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.senderId === user.uid;
                const showTimestamp = index === 0 || 
                  message.timestamp - messages[index - 1].timestamp > 300000; // 5 minutes

                return (
                  <div key={message.id}>
                    {showTimestamp && (
                      <div className="text-center text-xs text-gray-500 my-4">
                        {new Date(message.timestamp).toLocaleDateString() === new Date().toLocaleDateString() 
                          ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : new Date(message.timestamp).toLocaleString()
                        }
                      </div>
                    )}
                    
                    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isOwn 
                          ? 'bg-teal-600 text-white rounded-br-md' 
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <div className="flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message ${contactName}...`}
                  className="border-0 bg-transparent focus:ring-0 px-0 placeholder:text-gray-500"
                />
              </div>
              
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim()}
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 rounded-full h-10 w-10 p-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
