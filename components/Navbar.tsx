'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, PlusCircle, User, LogOut, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, userProfile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-teal-600" />
            <span className="text-2xl font-bold text-gray-800">Furbari</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/browse" className="text-gray-700 hover:text-teal-600 transition-colors">
              Browse Pets
            </Link>
            
            {user && (
              <>
                {userProfile?.userType === 'owner' && (
                  <Link href="/add-pet" className="flex items-center space-x-1 text-gray-700 hover:text-teal-600 transition-colors">
                    <PlusCircle className="h-4 w-4" />
                    <span>Add Pet</span>
                  </Link>
                )}
                
                <Link href="/chats" className="flex items-center space-x-1 text-gray-700 hover:text-teal-600 transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span>Chats</span>
                </Link>
                
                <Link href="/profile" className="flex items-center space-x-1 text-gray-700 hover:text-teal-600 transition-colors">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </>
            )}

            {!user && (
              <div className="flex items-center space-x-4">
                <Link href="/auth">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/auth?mode=signup">
                  <Button className="bg-teal-600 hover:bg-teal-700">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              <Link href="/browse" className="text-gray-700 hover:text-teal-600 transition-colors">
                Browse Pets
              </Link>
              
              {user && (
                <>
                  {userProfile?.userType === 'owner' && (
                    <Link href="/add-pet" className="flex items-center space-x-1 text-gray-700 hover:text-teal-600 transition-colors">
                      <PlusCircle className="h-4 w-4" />
                      <span>Add Pet</span>
                    </Link>
                  )}
                  
                  <Link href="/chats" className="flex items-center space-x-1 text-gray-700 hover:text-teal-600 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    <span>Chats</span>
                  </Link>
                  
                  <Link href="/profile" className="flex items-center space-x-1 text-gray-700 hover:text-teal-600 transition-colors">
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1 w-fit"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                </>
              )}

              {!user && (
                <div className="flex flex-col space-y-2">
                  <Link href="/auth">
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/auth?mode=signup">
                    <Button className="bg-teal-600 hover:bg-teal-700 w-full">Get Started</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;