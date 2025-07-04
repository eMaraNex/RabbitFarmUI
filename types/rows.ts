export interface Row {
  name: string;
  farm_id?: string;
  description?: string;
  capacity: number;
  occupied?: number;
  levels: string[];
  created_at?: string;
  updated_at?: string;
}

export interface AddRowDialogProps {
  open: boolean;
  onClose: () => void;
  onRowAdded?: () => void;
}