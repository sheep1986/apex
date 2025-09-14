import { apiClient } from '../lib/api-client';

export interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'away';
  };
  timestamp: Date;
  read: boolean;
  type: 'text' | 'image' | 'file';
  attachments?: {
    name: string;
    size: string;
    type: string;
  }[];
}

export interface Chat {
  id: string;
  type: 'direct' | 'channel';
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  participants?: number;
  isOnline?: boolean;
  isPinned?: boolean;
  isMuted?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  role: string;
  department?: string;
}

class MessagingService {
  // Get all chats
  async getChats(): Promise<Chat[]> {
    try {
      const response = await apiClient.get('/messaging/chats');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }

  // Get all channels
  async getChannels(): Promise<Chat[]> {
    try {
      const response = await apiClient.get('/messaging/channels');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw error;
    }
  }

  // Get contacts
  async getContacts(): Promise<Contact[]> {
    try {
      const response = await apiClient.get('/messaging/contacts');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching contacts:', error);
      throw error;
    }
  }

  // Get messages for a chat
  async getMessages(chatId: string): Promise<Message[]> {
    try {
      const response = await apiClient.get(`/messaging/messages/${chatId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(chatId: string, content: string, type: string = 'text'): Promise<Message> {
    try {
      const response = await apiClient.post('/messaging/messages', {
        chatId,
        content,
        type,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(chatId: string): Promise<void> {
    try {
      await apiClient.put(`/messaging/messages/read/${chatId}`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Create a new chat
  async createChat(type: 'direct' | 'channel', name: string, participants?: number): Promise<Chat> {
    try {
      const response = await apiClient.post('/messaging/chats', {
        type,
        name,
        participants,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  // Search messages and chats
  async search(query: string): Promise<{ messages: Message[]; chats: Chat[] }> {
    try {
      const response = await apiClient.get('/messaging/search', {
        params: { q: query },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching:', error);
      throw error;
    }
  }

  // Upload file
  async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/messaging/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}

export const messagingService = new MessagingService();
