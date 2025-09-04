export interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: 'male' | 'female';
  size: 'small' | 'medium' | 'large';
  description: string;
  location: string;
  imageUrl: string;
  ownerId: string;
  ownerName: string;
  ownerContact: string;
  isAdopted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdoptionRequest {
  id: string;
  petId: string;
  adopterId: string;
  ownerId: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: Date;
  petId?: string;
  petName?: string;
}