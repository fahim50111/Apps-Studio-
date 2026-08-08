export interface DownloadLink {
  name: string;
  url: string;
  /** Per-link update/upload time when provided by admin. */
  updatedAt?: number;
  timestamp?: number;
}

export interface AppItem {
  id: string;
  name: string;
  displayName?: string;
  category?: string;
  logo?: string;
  cover?: string;
  screenshots?: string[];
  link?: string;
  links?: DownloadLink[];
  versionName?: string;
  description?: string;
  size?: string;
  isMod?: boolean;
  downloads?: number;
  timestamp?: number;
  updatedAt?: number;
}

export interface Banner {
  id: string;
  image: string;
  title?: string;
  desc?: string;
  link?: string;
  timestamp?: number;
}

export interface AdminNotice {
  id: string;
  title: string;
  message: string;
  link?: string;
  timestamp?: number;
}

/** Public app request board — collection `requests` */
export interface AppRequest {
  id: string;
  date: string;
  name: string;
  status: string;
  text: string;
  timestamp: number;
}

/** Opaque pagination cursor — never import firestore types in UI code. */
export type PageCursor = unknown;

export interface Page {
  items: AppItem[];
  cursor: PageCursor | null;
  hasMore: boolean;
}
