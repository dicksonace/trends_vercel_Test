export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified?: boolean;
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
