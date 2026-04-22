export interface Document {
  id: string;
  title: string;
  totalPages: number;
  createdAt: number;
}

export interface Page {
  id: string;
  documentId: string;
  pageNumber: number;
  content?: string;
}

export interface Annotation {
  id: string;      // Unique identifier
  type: 'highlight' | 'comment'; // Annotation category
  x: number;       // Percentage offset from left (0 to 1)
  y: number;       // Percentage offset from top (0 to 1)
  width: number;   // Percentage of overall page width (0 to 1)
  height: number;  // Percentage of overall page height (0 to 1)
  color?: string;  // Optional hex color
  content?: string;// Text attached to the annotation
  status: 'syncing' | 'saved'; // Lifecycle tracking
}

export interface GhostCursor {
  id: string;      // Simulated connected user ID
  name: string;    // Display Name
  x: number;       // Percentage X
  y: number;       // Percentage Y
  color: string;   // Cursor Color
}
