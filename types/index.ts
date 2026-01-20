export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified?: boolean;
}

export interface Poll {
  options: string[];
  votes: number[];
  duration: string;
  endTime?: string;
  userVote?: number; // Index of the option the user voted for
}

export interface Tweet {
  id: string;
  user: User;
  content: string;
  timestamp: string;
  images?: string[];
  likes: number;
  retweets: number;
  replies: number;
  liked?: boolean;
  retweeted?: boolean;
  poll?: Poll;
}

export interface Comment {
  id: string;
  user: User;
  content: string;
  timestamp: string;
  likes: number;
  replies: number;
  tweetId: string;
}

export interface TrendingTopic {
  id: string;
  title: string;
  category: string;
  tweetCount: string;
}

export interface SuggestedUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified?: boolean;
}
