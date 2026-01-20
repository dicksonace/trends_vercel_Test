'use client';

import { List, Plus, Users, Lock } from 'lucide-react';

export default function ListsPage() {
  const lists = [
    {
      id: 1,
      name: 'Tech Influencers',
      description: 'Top tech influencers and thought leaders',
      members: 45,
      isPrivate: false,
    },
    {
      id: 2,
      name: 'Web Developers',
      description: 'Amazing web developers to follow',
      members: 128,
      isPrivate: false,
    },
    {
      id: 3,
      name: 'Design Inspiration',
      description: 'Best design accounts for daily inspiration',
      members: 67,
      isPrivate: true,
    },
    {
      id: 4,
      name: 'AI & ML',
      description: 'Artificial Intelligence and Machine Learning experts',
      members: 234,
      isPrivate: false,
    },
  ];

  return (
    <main className="border-x border-border bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-6 h-6 text-foreground" />
            <h2 className="text-2xl font-bold text-foreground">Lists</h2>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors">
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Create List</span>
          </button>
        </div>
      </div>

      {/* Lists Grid */}
      <div className="px-4 lg:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lists.map((list) => (
            <div
              key={list.id}
              className="group p-6 rounded-xl bg-muted/50 border border-border hover:bg-accent hover:border-blue-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                    <List className="w-5 h-5 text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors">{list.name}</h3>
                </div>
                {list.isPrivate && (
                  <div className="p-1.5 rounded-full bg-muted">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-muted-foreground mb-4">{list.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span className="font-medium">{list.members} members</span>
              </div>
            </div>
          ))}
        </div>

        {/* Create New List Card */}
        <div className="mt-4 p-6 rounded-lg border-2 border-dashed border-border hover:border-blue-500 transition-colors cursor-pointer">
          <div className="flex flex-col items-center justify-center text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Create a new list</h3>
            <p className="text-sm text-muted-foreground">
              Organize accounts into groups for easier discovery
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {lists.length === 0 && (
        <div className="px-4 lg:px-6 py-12 text-center">
          <List className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No lists yet</h3>
          <p className="text-muted-foreground mb-4">
            Create a list to organize accounts into groups.
          </p>
          <button className="px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-semibold transition-colors">
            Create your first list
          </button>
        </div>
      )}
    </main>
  );
}
