export type AppItem = {
  id: string;
  name: string;
  packageName?: string;
  icon?: string;
  category?: string;
  downloads?: number;
  rating?: number;
  version?: string;
  size?: string;
  description?: string;
  screenshots?: string[];
  developer?: string;
  updatedAt?: string;
  isMod?: boolean;
  isPremium?: boolean;
  downloadUrl?: string;
  tags?: string[];
};

export type Category = {
  id: string;
  name: string;
  icon?: string;
  count?: number;
};

export type Banner = {
  id: string;
  image: string;
  link?: string;
  title?: string;
};

export type UserProfile = {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: 'user' | 'admin';
  favorites?: string[];
  createdAt?: number;
};
