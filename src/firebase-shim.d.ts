declare module 'firebase/app' {
  export function initializeApp(config: Record<string, string>): unknown;
  export function getApps(): unknown[];
}

declare module 'firebase/firestore' {
  export type Firestore = unknown;
  export type DocumentData = Record<string, unknown>;
  export type QueryDocumentSnapshot<T = DocumentData> = {
    id: string;
    data: () => T;
  };
  export type Query<T = DocumentData> = unknown;
  export type DocumentReference = unknown;
  export type CollectionReference = unknown;
  export function initializeFirestore(
    app: unknown,
    settings: Record<string, unknown>
  ): Firestore;
  export function getFirestore(app?: unknown): Firestore;
  export function persistentLocalCache(opts?: Record<string, unknown>): unknown;
  export function persistentMultipleTabManager(): unknown;
  export function collection(db: Firestore, path: string): CollectionReference;
  export function doc(db: Firestore, path: string, id: string): DocumentReference;
  export function getDocs(q: unknown): Promise<{
    empty: boolean;
    docs: QueryDocumentSnapshot[];
  }>;
  export function getDocsFromCache(q: unknown): Promise<{
    empty: boolean;
    docs: QueryDocumentSnapshot[];
  }>;
  export function getDoc(ref: DocumentReference): Promise<{
    exists: () => boolean;
    id: string;
    data: () => DocumentData;
  }>;
  export function getDocFromCache(ref: DocumentReference): Promise<{
    exists: () => boolean;
    id: string;
    data: () => DocumentData;
  }>;
  export function addDoc(
    col: CollectionReference,
    data: Record<string, unknown>
  ): Promise<unknown>;
  export function updateDoc(
    ref: DocumentReference,
    data: Record<string, unknown>
  ): Promise<void>;
  export function increment(n: number): unknown;
  export function serverTimestamp(): unknown;
  export function query(col: CollectionReference, ...constraints: unknown[]): Query;
  export function where(field: string, op: string, value: unknown): unknown;
  export function orderBy(field: unknown, dir?: string): unknown;
  export function limit(n: number): unknown;
  export function startAfter(cursor: unknown): unknown;
  export function documentId(): unknown;
  export function getCountFromServer(col: CollectionReference): Promise<{
    data: () => { count: number };
  }>;
}
