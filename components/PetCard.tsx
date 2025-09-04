'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Pet } from '@/types/Pet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, MapPin, Calendar, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface PetCardProps {
  pet: Pet;
  onAdopt?: (petId: string) => void;
  onFavorite?: (petId: string) => void;
  isFavorited?: boolean;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onAdopt, onFavorite, isFavorited = false }) => {
  const { userProfile } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);

  const handleFavorite = () => {
    setFavorited(!favorited);
    onFavorite?.(pet.id);
  };

  const canAdopt = userProfile && !pet.isAdopted && pet.ownerId !== userProfile.uid;
  const isOwner = userProfile && pet.ownerId === userProfile.uid;
  const isLoggedIn = !!userProfile;

  return (
    <Card 
      className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        isHovered ? 'shadow-xl' : 'shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={pet.imageUrl}
          alt={pet.name}
          fill
          className="object-cover transition-transform duration-300 hover:scale-105"
        />
        
        {pet.isAdopted && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Badge className="bg-red-600 text-white text-lg px-4 py-2">
              Adopted
            </Badge>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={`absolute top-2 right-2 p-2 bg-white bg-opacity-80 hover:bg-opacity-100 transition-all duration-200 ${
            favorited ? 'text-red-500' : 'text-gray-600'
          }`}
          onClick={handleFavorite}
        >
          <Heart className={`h-5 w-5 ${favorited ? 'fill-current' : ''}`} />
        </Button>
      </div>

      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-gray-800">{pet.name}</h3>
          <Badge variant="secondary" className="bg-teal-100 text-teal-800">
            {pet.species}
          </Badge>
        </div>

        <p className="text-gray-600 mb-2">{pet.breed}</p>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{pet.age} {pet.age === 1 ? 'year' : 'years'} old</span>
          </div>
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>{pet.location}</span>
          </div>
        </div>

        <p className="text-gray-700 text-sm line-clamp-2 mb-3">
          {pet.description}
        </p>

        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <User className="h-4 w-4" />
          <span>by {pet.ownerName}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {!isLoggedIn ? (
          <div className="w-full text-center">
            <p className="text-sm text-gray-500 mb-2">Sign in to adopt this pet</p>
            <Button 
              onClick={() => window.location.href = '/auth'}
              variant="outline"
              className="w-full"
            >
              Sign In to Adopt
            </Button>
          </div>
        ) : isOwner ? (
          <div className="w-full text-center">
            <p className="text-sm text-gray-500">This is your pet</p>
          </div>
        ) : pet.isAdopted ? (
          <div className="w-full text-center">
            <p className="text-sm text-gray-500">This pet has been adopted</p>
          </div>
        ) : canAdopt ? (
          <Button 
            onClick={() => onAdopt?.(pet.id)}
            className="w-full bg-teal-600 hover:bg-teal-700 transition-colors"
          >
            Adopt {pet.name}
          </Button>
        ) : (
          <div className="w-full text-center">
            <p className="text-sm text-gray-500">Available for adoption</p>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default PetCard;