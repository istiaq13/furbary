'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, MapPin, Phone, Mail, Heart, PlusCircle } from 'lucide-react';
import PetCard from '@/components/PetCard';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pet } from '@/types/Pet';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, userProfile } = useAuth();
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && userProfile?.userType === 'owner') {
      fetchUserPets();
    } else {
      setLoading(false);
    }
  }, [user, userProfile]);

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
    } finally {
      setLoading(false);
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
        <Tabs defaultValue={userProfile.userType === 'owner' ? 'my-pets' : 'favorites'}>
          <TabsList className="grid w-full grid-cols-2">
            {userProfile.userType === 'owner' && (
              <TabsTrigger value="my-pets">My Pets</TabsTrigger>
            )}
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            {userProfile.userType === 'adopter' && (
              <TabsTrigger value="adoption-requests">Adoption Requests</TabsTrigger>
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

          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Favorite Pets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    No favorites yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Browse pets and click the heart icon to add them to your favorites.
                  </p>
                  <Link href="/browse">
                    <Button className="bg-teal-600 hover:bg-teal-700">
                      Browse Pets
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {userProfile.userType === 'adopter' && (
            <TabsContent value="adoption-requests">
              <Card>
                <CardHeader>
                  <CardTitle>Adoption Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      No adoption requests yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Your adoption requests will appear here.
                    </p>
                    <Link href="/browse">
                      <Button className="bg-teal-600 hover:bg-teal-700">
                        Find Pets to Adopt
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}