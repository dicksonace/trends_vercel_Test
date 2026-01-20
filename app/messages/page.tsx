'use client';

import { Search, Send, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  const conversations = [
    {
      id: 1,
      name: 'John Doe',
      username: '@johndoe',
      avatar: 'JD',
      lastMessage: 'Hey, how are you doing?',
      time: '2m',
      unread: 2,
    },
    {
      id: 2,
      name: 'Jane Smith',
      username: '@janesmith',
      avatar: 'JS',
      lastMessage: 'Thanks for the help!',
      time: '1h',
      unread: 0,
    },
    {
      id: 3,
      name: 'Tech News',
      username: '@technews',
      avatar: 'TN',
      lastMessage: 'Check out this new feature',
      time: '3h',
      unread: 1,
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      username: '@sarahw',
      avatar: 'SW',
      lastMessage: 'See you tomorrow!',
      time: '1d',
      unread: 0,
    },
  ];

  const messages = [
    { id: 1, text: 'Hey, how are you doing?', sender: 'other', time: '2:30 PM' },
    { id: 2, text: 'I\'m doing great, thanks for asking!', sender: 'me', time: '2:32 PM' },
    { id: 3, text: 'That\'s awesome! Want to catch up later?', sender: 'other', time: '2:33 PM' },
  ];

  return (
    <main className="border-x border-border bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Messages</h2>
          <button className="p-2 rounded-full hover:bg-accent transition-colors">
            <MoreVertical className="w-5 h-5 text-foreground" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages"
            className="w-full pl-10 pr-4 py-2 rounded-full bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-border">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => setSelectedChat(conversation.id)}
              className={`px-4 lg:px-6 py-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                selectedChat === conversation.id ? 'bg-muted' : ''
              }`}
            >
              <Link
                href={`/profile/${conversation.username.replace('@', '')}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                  {conversation.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-foreground truncate hover:underline">{conversation.name}</h3>
                    <span className="text-xs text-muted-foreground">{conversation.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                    {conversation.unread > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {conversation.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Chat View (when a conversation is selected) */}
      {selectedChat && (
        <div className="fixed inset-0 bg-background z-50 lg:relative lg:z-auto lg:border-l lg:border-border">
          <div className="flex flex-col h-full">
            {/* Chat Header */}
            <div className="border-b border-border px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedChat(null)}
                  className="lg:hidden p-2 rounded-full hover:bg-accent transition-colors"
                >
                  ←
                </button>
                <h3 className="font-semibold text-foreground">
                  {conversations.find(c => c.id === selectedChat)?.name}
                </h3>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      message.sender === 'me'
                        ? 'bg-blue-500 text-white'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <p>{message.text}</p>
                    <p className={`text-xs mt-1 ${message.sender === 'me' ? 'text-blue-100' : 'text-muted-foreground'}`}>
                      {message.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="border-t border-border px-4 py-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message"
                  className="flex-1 px-4 py-2 rounded-full bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="p-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
