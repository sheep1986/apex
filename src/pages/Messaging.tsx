import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Phone, User, Clock, Search, Filter } from 'lucide-react';

const Messaging: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Mock conversation data
  const conversations = [
    {
      id: '1',
      contact: 'John Doe',
      phone: '+1 (555) 123-4567',
      lastMessage: 'Thanks for the follow-up call!',
      timestamp: '2 hours ago',
      unread: 2,
      status: 'active'
    },
    {
      id: '2',
      contact: 'Jane Smith',
      phone: '+1 (555) 987-6543',
      lastMessage: 'When can we schedule the next meeting?',
      timestamp: '5 hours ago',
      unread: 0,
      status: 'pending'
    },
    {
      id: '3',
      contact: 'Mike Johnson',
      phone: '+1 (555) 456-7890',
      lastMessage: 'Received the proposal, reviewing now.',
      timestamp: '1 day ago',
      unread: 1,
      status: 'completed'
    }
  ];

  const messages = selectedConversation ? [
    {
      id: '1',
      sender: 'contact',
      text: 'Hi, I received your call earlier today.',
      timestamp: '10:30 AM'
    },
    {
      id: '2',
      sender: 'agent',
      text: 'Great! Thanks for getting back to me. How did you find the information we discussed?',
      timestamp: '10:35 AM'
    },
    {
      id: '3',
      sender: 'contact',
      text: 'Very helpful! I\'m interested in moving forward.',
      timestamp: '10:40 AM'
    },
    {
      id: '4',
      sender: 'agent',
      text: 'Excellent! I\'ll send you the next steps via email.',
      timestamp: '10:42 AM'
    }
  ] : [];

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="mb-6 flex items-center space-x-4">
        <div className="p-3 bg-pink-500/20 rounded-lg">
          <MessageSquare className="h-8 w-8 text-pink-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Messaging</h1>
          <p className="text-gray-400">Manage conversations and follow-ups with leads</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 border-gray-800 bg-gray-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <MessageSquare className="h-5 w-5 text-pink-400" />
              Conversations
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search conversations..." className="pl-10 border-gray-700 bg-gray-800 text-white placeholder-gray-500" />
              </div>
              <Button variant="outline" size="icon" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-800">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-4 cursor-pointer hover:bg-gray-800 transition-colors ${
                    selectedConversation === conversation.id ? 'bg-purple-500/10 border-r-2 border-purple-500' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-400" />
                      <span className="font-medium text-white">{conversation.contact}</span>
                    </div>
                    {conversation.unread > 0 && (
                      <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs bg-pink-500 text-white">
                        {conversation.unread}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-1">{conversation.phone}</p>
                  <p className="text-sm text-gray-500 truncate mb-2">{conversation.lastMessage}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{conversation.timestamp}</span>
                    <Badge
                      className={`text-xs ${
                        conversation.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        conversation.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}
                    >
                      {conversation.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 border-gray-800 bg-gray-900">
          {selectedConversation ? (
            <>
              <CardHeader className="border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <User className="h-5 w-5 text-blue-400" />
                      {conversations.find(c => c.id === selectedConversation)?.contact}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1 text-gray-400">
                      <Phone className="h-4 w-4 text-purple-400" />
                      {conversations.find(c => c.id === selectedConversation)?.phone}
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
                    <Phone className="h-4 w-4 mr-2 text-purple-400" />
                    Call
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col h-full p-0">
                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.sender === 'agent'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 opacity-70" />
                          <span className="text-xs opacity-70">{message.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-800 p-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      className="resize-none min-h-[60px] border-gray-700 bg-gray-800 text-white placeholder-gray-500"
                    />
                    <Button size="icon" className="self-end bg-emerald-600 hover:bg-emerald-700">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-pink-400" />
                <h3 className="text-lg font-medium mb-2 text-white">Select a Conversation</h3>
                <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messaging;
