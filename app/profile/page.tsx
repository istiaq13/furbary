'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, MapPin, Phone, Mail, Heart, PlusCircle, MessageCircle, Check, X, Clock } from 'lucide-react';
import PetCard from '@/components/PetCard';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pet } from '@/types/Pet';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface AdoptionRequest {
  id: string;
  petId: string;
  petName: string;
  adopterId: string;
  adopterName: string;
  adopterEmail: string;
  adopterPhone: string;
  ownerId: string;
  ownerName: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export default function ProfilePage() {
  const { user, userProfile } = useAuth();
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [adoptionRequests, setAdoptionRequests] = useState<AdoptionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<AdoptionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPets = async () => {
      if (!user) return;

      try {
        const petsRef = collection(db, 'pets');
        const q = query(
          petsRef,
          where('ownerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        
        const pets = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate(),
        })) as Pet[];
        
        setUserPets(pets);
      } catch (error) {
        console.error('Error fetching user pets:', error);
      }
    };

    const fetchAdoptionRequests = async () => {
      if (!user) return;

      try {
        console.log('Fetching adoption requests for user:', user.uid);
        
        // Fetch requests received by this user (as pet owner)
        const receivedRequestsRef = collection(db, 'adoptionRequests');
        
        // First try to get all adoption requests to see if they exist
        const allRequestsSnapshot = await getDocs(receivedRequestsRef);
        console.log('Total adoption requests in database:', allRequestsSnapshot.docs.length);
        
        allRequestsSnapshot.docs.forEach(doc => {
          console.log('Request:', { id: doc.id, ...doc.data() });
        });

        const receivedQuery = query(
          receivedRequestsRef,
          where('ownerId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const receivedSnapshot = await getDocs(receivedQuery);
        console.log('Received requests count:', receivedSnapshot.docs.length);
        
        const receivedRequests = receivedSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as AdoptionRequest[];
        
        console.log('Processed received requests:', receivedRequests);
        setAdoptionRequests(receivedRequests);

        // Fetch requests sent by this user (as adopter)
        const sentRequestsRef = collection(db, 'adoptionRequests');
        const sentQuery = query(
          sentRequestsRef,
          where('adopterId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const sentSnapshot = await getDocs(sentQuery);
        console.log('Sent requests count:', sentSnapshot.docs.length);
        
        const sentRequests = sentSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as AdoptionRequest[];
        
        console.log('Processed sent requests:', sentRequests);
        setSentRequests(sentRequests);
      } catch (error) {
        console.error('Error fetching adoption requests:', error);
        
        // Fallback: try without orderBy to see if it's an index issue
        try {
          console.log('Trying fallback query without orderBy...');
          const fallbackQuery = query(
            collection(db, 'adoptionRequests'),
            where('ownerId', '==', user.uid)
          );
          const fallbackSnapshot = await getDocs(fallbackQuery);
          
          const fallbackRequests = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as AdoptionRequest[];
          
          console.log('Fallback received requests:', fallbackRequests);
          setAdoptionRequests(fallbackRequests);
          
          // Also try for sent requests
          const fallbackSentQuery = query(
            collection(db, 'adoptionRequests'),
            where('adopterId', '==', user.uid)
          );
          const fallbackSentSnapshot = await getDocs(fallbackSentQuery);
          
          const fallbackSentRequests = fallbackSentSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
          })) as AdoptionRequest[];
          
          console.log('Fallback sent requests:', fallbackSentRequests);
          setSentRequests(fallbackSentRequests);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
        }
      }
    };

    if (user) {
      Promise.all([
        userProfile?.userType === 'owner' ? fetchUserPets() : Promise.resolve(),
        fetchAdoptionRequests()
      ]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, userProfile]);

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const request = adoptionRequests.find(r => r.id === requestId);
      if (!request) return;

      // Update the adoption request status
      await updateDoc(doc(db, 'adoptionRequests', requestId), {
        status: action === 'approve' ? 'approved' : 'rejected',
        updatedAt: new Date(),
      });

      if (action === 'approve') {
        // Create a chat between the adopter and owner
        const chatData = {
          participants: [request.adopterId, request.ownerId],
          participantNames: {
            [request.adopterId]: request.adopterName,
            [request.ownerId]: request.ownerName,
          },
          petId: request.petId,
          petName: request.petName,
          lastMessage: `Adoption request for ${request.petName} has been approved! You can now chat.`,
          lastMessageTime: new Date(),
          createdAt: new Date(),
        };

        await addDoc(collection(db, 'chats'), chatData);
        toast.success(`Adoption request approved! A chat has been created with ${request.adopterName}.`);
      } else {
        toast.success('Adoption request rejected.');
      }

      // Update local state
      setAdoptionRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: action === 'approve' ? 'approved' : 'rejected' }
            : req
        )
      );

    } catch (error) {
      console.error('Error updating adoption request:', error);
      toast.error('Failed to update adoption request.');
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Please sign in</h2>
            <p className="text-gray-600 mb-4">
              You need to be logged in to view your profile.
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
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
              <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
              
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                  {userProfile.name}
                </h1>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>{userProfile.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <MapPin className="h-4 w-4" />
                    <span>{userProfile.location}</span>
                  </div>
                  
                  {userProfile.phone && (
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>{userProfile.phone}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-3">
                  <Badge 
                    className={`${
                      userProfile.userType === 'owner' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {userProfile.userType === 'owner' ? 'Pet Owner' : 'Pet Adopter'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue={userProfile.userType === 'owner' ? 'my-pets' : 'sent-requests'}>
          <TabsList className="grid w-full grid-cols-2">
            {userProfile.userType === 'owner' ? (
              <>
                <TabsTrigger value="my-pets">My Pets</TabsTrigger>
                <TabsTrigger value="adoption-requests">
                  Adoption Requests 
                  {adoptionRequests.filter(r => r.status === 'pending').length > 0 && (
                    <Badge className="ml-2 bg-red-500 text-white text-xs px-2 py-1">
                      {adoptionRequests.filter(r => r.status === 'pending').length}
                    </Badge>
                  )}
                </TabsTrigger>
              </>
            ) : (
              <>
                <TabsTrigger value="sent-requests">My Requests</TabsTrigger>
                <TabsTrigger value="chats">Chats</TabsTrigger>
              </>
            )}
          </TabsList>

          {userProfile.userType === 'owner' && (
            <TabsContent value="my-pets">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Your Pets</CardTitle>
                  <Link href="/add-pet">
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Add Pet
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {userPets.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        No pets added yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Start by adding your first pet for adoption.
                      </p>
                      <Link href="/add-pet">
                        <Button className="bg-teal-600 hover:bg-teal-700">
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add Your First Pet
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {userPets.map((pet) => (
                        <PetCard key={pet.id} pet={pet} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {userProfile.userType === 'owner' && (
            <TabsContent value="adoption-requests">
              <Card>
                <CardHeader>
                  <CardTitle>Adoption Requests for Your Pets</CardTitle>
                </CardHeader>
                <CardContent>
                  {adoptionRequests.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        No adoption requests yet
                      </h3>
                      <p className="text-gray-600 mb-4">
                        When someone wants to adopt your pets, requests will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {adoptionRequests.map((request) => (
                        <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-lg">{request.petName}</h4>
                              <p className="text-gray-600">Request from {request.adopterName}</p>
                              <p className="text-sm text-gray-500">
                                {request.createdAt.toLocaleDateString()} at {request.createdAt.toLocaleTimeString()}
                              </p>
                            </div>
                            <Badge 
                              className={`${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {request.status}
                            </Badge>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-gray-700 bg-white p-3 rounded border">
                              &ldquo;{request.message}&rdquo;
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              <p>Email: {request.adopterEmail}</p>
                              {request.adopterPhone && <p>Phone: {request.adopterPhone}</p>}
                            </div>
                            
                            {request.status === 'pending' && (
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleRequestAction(request.id, 'reject')}
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => handleRequestAction(request.id, 'approve')}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approve & Chat
                                </Button>
                              </div>
                            )}
                            
                            {request.status === 'approved' && (
                              <Link href="/chats">
                                <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  Go to Chat
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {userProfile.userType !== 'owner' && (
            <>
              <TabsContent value="sent-requests">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Adoption Requests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sentRequests.length === 0 ? (
                      <div className="text-center py-12">
                        <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                          No adoption requests sent yet
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Browse pets and click &ldquo;Adopt&rdquo; to send adoption requests.
                        </p>
                        <Link href="/browse">
                          <Button className="bg-teal-600 hover:bg-teal-700">
                            Browse Pets
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {sentRequests.map((request) => (
                          <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-semibold text-lg">{request.petName}</h4>
                                <p className="text-gray-600">Request to {request.ownerName}</p>
                                <p className="text-sm text-gray-500">
                                  Sent on {request.createdAt.toLocaleDateString()} at {request.createdAt.toLocaleTimeString()}
                                </p>
                              </div>
                              <Badge 
                                className={`${
                                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  'bg-red-100 text-red-800'
                                }`}
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                {request.status}
                              </Badge>
                            </div>
                            
                            <div className="mb-3">
                              <p className="text-gray-700 bg-white p-3 rounded border">
                                &ldquo;{request.message}&rdquo;
                              </p>
                            </div>
                            
                            {request.status === 'approved' && (
                              <div className="flex justify-end">
                                <Link href="/chats">
                                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700">
                                    <MessageCircle className="h-4 w-4 mr-1" />
                                    Go to Chat
                                  </Button>
                                </Link>
                              </div>
                            )}
                            
                            {request.status === 'rejected' && (
                              <div className="text-center text-gray-500 text-sm">
                                Your adoption request was not approved.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chats">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Chats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        No active chats
                      </h3>
                      <p className="text-gray-600 mb-4">
                        When your adoption requests are approved, chats will appear here.
                      </p>
                      <Link href="/chats">
                        <Button className="bg-teal-600 hover:bg-teal-700">
                          Go to Chats
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}