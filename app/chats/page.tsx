'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, User } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Contact {
  id: string;
  name: string;
  petName?: string;
  petId?: string;
}

export default function ChatsPage() {
  const { user, userProfile } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    if (!user || !userProfile) return;

    const fetchContacts = async () => {
      try {
        console.log('Fetching contacts for user:', user.uid);
        
        // Get approved adoption requests where user is the owner
        const ownerRequestsQuery = query(
          collection(db, 'adoptionRequests'),
          where('ownerId', '==', user.uid),
          where('status', '==', 'approved')
        );
        
        // Get approved adoption requests where user is the adopter
        const adopterRequestsQuery = query(
          collection(db, 'adoptionRequests'),
          where('adopterId', '==', user.uid),
          where('status', '==', 'approved')
        );

        const [ownerSnapshot, adopterSnapshot] = await Promise.all([
          getDocs(ownerRequestsQuery),
          getDocs(adopterRequestsQuery)
        ]);

        const contactsList: Contact[] = [];

        // Add contacts from requests where user is owner (adopters they approved)
        ownerSnapshot.docs.forEach(doc => {
          const data = doc.data();
          contactsList.push({
            id: data.adopterId,
            name: data.adopterName,
            petName: data.petName,
            petId: data.petId,
          });
        });

        // Add contacts from requests where user is adopter (owners who approved them)
        adopterSnapshot.docs.forEach(doc => {
          const data = doc.data();
          contactsList.push({
            id: data.ownerId,
            name: data.ownerName,
            petName: data.petName,
            petId: data.petId,
          });
        });

        // Remove duplicates
        const uniqueContacts = contactsList.filter((contact, index, self) => 
          index === self.findIndex(c => c.id === contact.id)
        );

        console.log('Found contacts:', uniqueContacts);
        setContacts(uniqueContacts);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };

    fetchContacts();
  }, [user, userProfile]);

  const openChat = (contactId: string, contactName: string, petName?: string) => {
    // Create a deterministic chat ID
    const chatId = user!.uid < contactId 
      ? `${user!.uid}_${contactId}`
      : `${contactId}_${user!.uid}`;
    
    // Navigate to chat page
    window.location.href = `/chats/${chatId}?contactName=${encodeURIComponent(contactName)}&petName=${encodeURIComponent(petName || '')}`;
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
            <Link href="/auth">
              <Button className="bg-teal-600 hover:bg-teal-700">
                Sign In
              </Button>
            </Link>
          </CardContent>
        </Card>
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
            Chat with people you&apos;ve connected with through adoption requests
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Contacts</CardTitle>
            </CardHeader>
            <CardContent>
              {contacts.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-800 mb-2">No messages</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    You haven&apos;t contacted anyone yet. Approve or get approved for adoption requests to start chatting.
                  </p>
                  <div className="space-y-2">
                    <Link href="/browse">
                      <Button variant="outline" size="sm" className="w-full">
                        Browse Pets
                      </Button>
                    </Link>
                    <Link href="/profile">
                      <Button variant="outline" size="sm" className="w-full">
                        Check Requests
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => openChat(contact.id, contact.name, contact.petName)}
                      className="w-full text-left p-4 rounded-lg transition-colors hover:bg-gray-50 border border-gray-200 hover:border-teal-200"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">
                            {contact.name}
                          </h3>
                          {contact.petName && (
                            <p className="text-sm text-teal-600">
                              About: {contact.petName}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            Click to start chatting
                          </p>
                        </div>
                        
                        <MessageCircle className="h-5 w-5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}