import Sidebar from '@/components/Sidebar';
import { mockTrendingTopics, mockSuggestedUsers } from '@/lib/mockData';

export default function SidebarSlot() {
  return (
    <Sidebar 
      trendingTopics={mockTrendingTopics}
      suggestedUsers={mockSuggestedUsers}
    />
  );
}

