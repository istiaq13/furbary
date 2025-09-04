'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';
import PetCard from '@/components/PetCard';
import { collection, query, orderBy, getDocs, where, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Pet } from '@/types/Pet';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function BrowsePage() {
  const { userProfile } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  useEffect(() => {
    fetchPets();
  }, []);

  useEffect(() => {
    const filterPets = () => {
      let filtered = pets;

      if (searchTerm) {
        filtered = filtered.filter(pet =>
          pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pet.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pet.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (selectedSpecies !== 'all') {
        filtered = filtered.filter(pet => pet.species === selectedSpecies);
      }

      if (selectedSize !== 'all') {
        filtered = filtered.filter(pet => pet.size === selectedSize);
      }

      if (selectedLocation !== 'all') {
        filtered = filtered.filter(pet =>
          pet.location.toLowerCase().includes(selectedLocation.toLowerCase())
        );
      }

      setFilteredPets(filtered);
    };

    filterPets();
  }, [pets, searchTerm, selectedSpecies, selectedSize, selectedLocation]);

  const fetchPets = async () => {
    try {
      console.log('Fetching pets...');
      const petsRef = collection(db, 'pets');
      
      // First, try to get all pets without the compound query
      const allPetsQuery = query(petsRef, orderBy('createdAt', 'desc'));
      const allPetsSnapshot = await getDocs(allPetsQuery);
      console.log('All pets count:', allPetsSnapshot.docs.length);
      
      // Then apply the filter for non-adopted pets
      const q = query(
        petsRef,
        where('isAdopted', '==', false),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      console.log('Non-adopted pets count:', querySnapshot.docs.length);
      
      const petsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Pet data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        };
      }) as Pet[];
      
      console.log('Processed pets data:', petsData);
      setPets(petsData);
    } catch (error) {
      console.error('Error fetching pets:', error);
      
      // Fallback: try to get pets without the compound query
      try {
        console.log('Trying fallback query...');
        const petsRef = collection(db, 'pets');
        const querySnapshot = await getDocs(petsRef);
        
        const petsData = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as Pet;
          })
          .filter(pet => !pet.isAdopted);
        
        console.log('Fallback pets data:', petsData);
        setPets(petsData);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSpecies('all');
    setSelectedSize('all');
    setSelectedLocation('all');
  };

  const getUniqueLocations = () => {
    const locations = pets.map(pet => pet.location);
    return Array.from(new Set(locations));
  };

  const handleAdopt = async (petId: string) => {
    if (!userProfile) {
      toast.error('Please sign in to adopt a pet');
      return;
    }

    if (userProfile.userType !== 'adopter') {
      toast.error('Only adopters can request to adopt pets');
      return;
    }

    try {
      const pet = filteredPets.find(p => p.id === petId);
      if (!pet) {
        toast.error('Pet not found');
        return;
      }

      // Create an adoption request
      const adoptionRequest = {
        petId: petId,
        petName: pet.name,
        adopterId: userProfile.uid,
        adopterName: userProfile.name,
        adopterEmail: userProfile.email,
        adopterPhone: userProfile.phone || '',
        ownerId: pet.ownerId,
        ownerName: pet.ownerName,
        message: `Hi! I'm interested in adopting ${pet.name}. Could we discuss this further?`,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'adoptionRequests'), adoptionRequest);
      
      // Also create a chat between the adopter and owner
      const chatData = {
        participants: [userProfile.uid, pet.ownerId],
        participantNames: {
          [userProfile.uid]: userProfile.name,
          [pet.ownerId]: pet.ownerName,
        },
        petId: petId,
        petName: pet.name,
        lastMessage: `${userProfile.name} is interested in adopting ${pet.name}`,
        lastMessageTime: new Date(),
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'chats'), chatData);

      toast.success(`Adoption request sent for ${pet.name}! Check your chats to continue the conversation.`);
      
      // Optionally redirect to chats
      // window.location.href = '/chats';
      
    } catch (error) {
      console.error('Error creating adoption request:', error);
      toast.error('Failed to send adoption request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-t-lg"></div>
                <div className="bg-white p-4 rounded-b-lg space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            Find Your Perfect Pet
          </h1>
          <p className="text-xl text-gray-600">
            Discover amazing pets looking for their forever homes
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, breed, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Species Filter */}
            <div>
              <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
                <SelectTrigger>
                  <SelectValue placeholder="Species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  <SelectItem value="dog">Dogs</SelectItem>
                  <SelectItem value="cat">Cats</SelectItem>
                  <SelectItem value="bird">Birds</SelectItem>
                  <SelectItem value="rabbit">Rabbits</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Size Filter */}
            <div>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div>
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {searchTerm && (
              <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                Search: {searchTerm}
              </Badge>
            )}
            {selectedSpecies !== 'all' && (
              <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                Species: {selectedSpecies}
              </Badge>
            )}
            {selectedSize !== 'all' && (
              <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                Size: {selectedSize}
              </Badge>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredPets.length} of {pets.length} pets
          </p>
        </div>

        {/* Pet Grid */}
        {filteredPets.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <Search className="h-16 w-16 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No pets found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or browse all available pets.
            </p>
            <Button onClick={clearFilters} variant="outline">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onAdopt={handleAdopt}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}