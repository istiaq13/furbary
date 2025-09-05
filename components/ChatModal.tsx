'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ref, push, set, query, orderByChild, equalTo, get, update } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  petId?: string;
  petName?: string;
  onChatCreated?: (chatId: string) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  petId,
  petName,
  onChatCreated
}) => {
  const { userProfile } = useAuth();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim() || !userProfile) {
      console.log('Cannot send message:', { message: message.trim(), userProfile });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Starting message send process...');
      console.log('User profile:', userProfile);
      console.log('Recipient ID:', recipientId);
      console.log('Firebase Realtime DB reference:', realtimeDb);
      
      // Test database connection first
      const testRef = ref(realtimeDb, '.info/connected');
      const connectionSnapshot = await get(testRef);
      console.log('Database connection status:', connectionSnapshot.val());
      
      console.log('Creating/finding chat with:', { userProfile, recipientId, recipientName, petId, petName });
      
      // First, check if a chat already exists between these users
      const chatsRef = ref(realtimeDb, 'chats');
      console.log('Chats reference created:', chatsRef);
      
      const chatsSnapshot = await get(chatsRef);
      console.log('Chats snapshot:', chatsSnapshot.exists(), chatsSnapshot.val());
      
      let existingChatId: string | null = null;
      
      if (chatsSnapshot.exists()) {
        const chatsData = chatsSnapshot.val();
        console.log('Existing chats data:', chatsData);
        // Look for existing chat between these two users
        for (const [chatId, chatData] of Object.entries(chatsData as any)) {
          const chat = chatData as any;
          if (chat.participants && 
              chat.participants.includes(userProfile.uid) && 
              chat.participants.includes(recipientId)) {
            existingChatId = chatId;
            console.log('Found existing chat:', chatId);
            break;
          }
        }
      }
      
      let chatId: string;
      
      if (existingChatId) {
        // Use existing chat
        chatId = existingChatId;
        console.log('Using existing chat:', chatId);
        
        // Update the last message info
        const chatRef = ref(realtimeDb, `chats/${chatId}`);
        await update(chatRef, {
          lastMessage: message.trim(),
          lastMessageTime: Date.now(),
        });
        console.log('Updated existing chat last message');
      } else {
        // Create a new chat
        console.log('Creating new chat...');
        const newChatRef = push(chatsRef);
        chatId = newChatRef.key!;
        console.log('New chat ID:', chatId);
        
        const chatData = {
          participants: [userProfile.uid, recipientId],
          participantNames: {
            [userProfile.uid]: userProfile.name,
            [recipientId]: recipientName,
          },
          petId: petId || null,
          petName: petName || null,
          lastMessage: message.trim(),
          lastMessageTime: Date.now(),
          createdAt: Date.now(),
        };

        console.log('Creating new chat data:', chatData);
        await set(newChatRef, chatData);
        console.log('Chat created successfully with ID:', chatId);
      }

      // Add the message
      const messageData = {
        chatId: chatId,
        senderId: userProfile.uid,
        senderName: userProfile.name,
        message: message.trim(),
        timestamp: Date.now(),
      };

      const messagesRef = ref(realtimeDb, `chats/${chatId}/messages`);
      console.log('Adding message to path:', `chats/${chatId}/messages`);
      console.log('Message data:', messageData);
      
      const messageResult = await push(messagesRef, messageData);
      console.log('Message sent successfully with ID:', messageResult.key);

      toast.success('Message sent instantly!');
      
      if (onChatCreated && chatId) {
        onChatCreated(chatId);
      }
      
      setMessage('');
      onClose();
      
      // Immediately redirect to the specific chat page
      console.log('Redirecting to chat:', `/chats/${chatId}`);
      window.location.href = `/chats/${chatId}`;
      
    } catch (error) {
      console.error('Detailed error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Error details:', errorMessage);
      toast.error(`Failed to send message: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a conversation with {recipientName}</DialogTitle>
          {petName && (
            <p className="text-sm text-gray-600">About: {petName}</p>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Your message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here..."
              className="mt-1 min-h-[100px]"
              disabled={isLoading}
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatModal;
