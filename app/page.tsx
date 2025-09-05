'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Search, MessageCircle, Shield, Award, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PetCard from '@/components/PetCard';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pet } from '@/types/Pet';

export default function Home() {
  const { user, userProfile } = useAuth();
  const [featuredPets, setFeaturedPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedPets = async () => {
      try {
        const petsRef = collection(db, 'pets');
        const q = query(petsRef, limit(20));
        const querySnapshot = await getDocs(q);
        
        const allPets = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Pet[];
        
        // Filter available pets and sort by creation date on client side
        const availablePets = allPets
          .filter(pet => !pet.isAdopted)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 6);
        
        setFeaturedPets(availablePets);
      } catch (error) {
        console.error('Error fetching featured pets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPets();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-teal-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-teal-600 to-teal-700 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Find Your Perfect
            <span className="block text-teal-200">Furry Companion</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Connect loving pets with caring families. Every pet deserves a forever home.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <Button size="lg" className="bg-white text-teal-600 hover:bg-gray-100">
                <Search className="h-5 w-5 mr-2" />
                Browse Pets
              </Button>
            </Link>
            
            {!user && (
              <Link href="/auth?mode=signup">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-teal-600">
                  <Heart className="h-5 w-5 mr-2" />
                  Join Furbari
                </Button>
              </Link>
            )}
            
            {user && userProfile?.userType === 'owner' && (
              <Link href="/add-pet">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-teal-600">
                  <Heart className="h-5 w-5 mr-2" />
                  Add Your Pet
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Choose Furbari?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make pet adoption safe, easy, and joyful for everyone involved.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
                <p className="text-gray-600">
                  Verified users and secure messaging to ensure safe adoption processes.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <MessageCircle className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Direct Communication</h3>
                <p className="text-gray-600">
                  Chat directly with pet owners to learn more about your future companion.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Community Focused</h3>
                <p className="text-gray-600">
                  Join a community of pet lovers dedicated to finding perfect matches.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Pets Section */}
      <section className="py-16 bg-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Featured Pets
            </h2>
            <p className="text-xl text-gray-600">
              Meet some of our amazing pets looking for their forever homes.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-200"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPets.map((pet) => (
                <PetCard key={pet.id} pet={pet} />
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/browse">
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                View All Pets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Whether you're looking to adopt or help a pet find a new home, start your journey today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/browse">
              <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                <Search className="h-5 w-5 mr-2" />
                Find a Pet
              </Button>
            </Link>
            
            {!user && (
              <Link href="/auth?mode=signup">
                <Button size="lg" variant="outline" className="border-teal-600 text-teal-600 hover:bg-teal-50">
                  <Heart className="h-5 w-5 mr-2" />
                  Join Our Community
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}