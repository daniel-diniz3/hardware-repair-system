export interface Annotation {
  id: string;
  type: 'damage' | 'component' | 'trace' | 'via';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
}

export interface PCBAnalysis {
  imageUrl: string;
  annotations: Annotation[];
  metadata: {
    resolution: string;
    size: string;
    format: string;
    uploadDate: Date;
  };
}
