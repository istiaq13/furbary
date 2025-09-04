'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2 } from 'lucide-react';
import { uploadImage } from '@/lib/cloudinary';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const petSchema = z.object({
  name: z.string().min(1, 'Pet name is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().min(1, 'Breed is required'),
  age: z.number().min(0, 'Age must be positive').max(30, 'Age seems too high'),
  gender: z.enum(['male', 'female']),
  size: z.enum(['small', 'medium', 'large']),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(1, 'Location is required'),
});

type PetFormData = z.infer<typeof petSchema>;

interface PetFormProps {
  onSuccess?: () => void;
}

const PetForm: React.FC<PetFormProps> = ({ onSuccess }) => {
  const { userProfile } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PetFormData) => {
    if (!imageFile) {
      toast.error('Please select an image for your pet');
      return;
    }

    if (!userProfile) {
      toast.error('You must be logged in to add a pet');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload image to Cloudinary
      const imageUrl = await uploadImage(imageFile);

      // Save pet data to Firestore
      const petData = {
        ...data,
        imageUrl,
        ownerId: userProfile.uid,
        ownerName: userProfile.name,
        ownerContact: userProfile.email,
        isAdopted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, 'pets'), petData);
      
      toast.success('Pet added successfully!');
      reset();
      setImageFile(null);
      setImagePreview('');
      onSuccess?.();
      
    } catch (error) {
      console.error('Error adding pet:', error);
      toast.error('Failed to add pet. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center text-gray-800">
          Add Your Pet for Adoption
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <div>
            <Label htmlFor="image" className="text-sm font-medium">Pet Photo</Label>
            <div className="mt-2">
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label
                htmlFor="image"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={imagePreview}
                      alt="Pet preview"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500">Click to upload pet photo</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Pet Name</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter pet name"
                className="mt-1"
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <Label htmlFor="species">Species</Label>
              <Select onValueChange={(value) => setValue('species', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="hamster">Hamster</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.species && <p className="text-red-500 text-sm mt-1">{errors.species.message}</p>}
            </div>

            <div>
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                {...register('breed')}
                placeholder="Enter breed"
                className="mt-1"
              />
              {errors.breed && <p className="text-red-500 text-sm mt-1">{errors.breed.message}</p>}
            </div>

            <div>
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                type="number"
                {...register('age', { valueAsNumber: true })}
                placeholder="Enter age"
                className="mt-1"
              />
              {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>}
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select onValueChange={(value) => setValue('gender', value as 'male' | 'female')}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
              {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
            </div>

            <div>
              <Label htmlFor="size">Size</Label>
              <Select onValueChange={(value) => setValue('size', value as 'small' | 'medium' | 'large')}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
              {errors.size && <p className="text-red-500 text-sm mt-1">{errors.size.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              {...register('location')}
              placeholder="Enter location (city, state)"
              className="mt-1"
            />
            {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Tell us about your pet's personality, habits, and special needs..."
              className="mt-1 min-h-[120px]"
            />
            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-teal-600 hover:bg-teal-700 transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding Pet...
              </>
            ) : (
              'Add Pet for Adoption'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PetForm;