export type InventoryItem = {
  id: string;
  name: string;
  image?: string;
  expiryDate: string; // ISO format YYYY-MM-DD
  quantity: number;
  unit: 'pkg' | 'kg' | 'l';
  category: 'Dairy' | 'Grain' | 'Vegetable' | 'Meat' | 'Other';
  isOpened: boolean;
  openedDate?: string;
  status: 'Good' | 'Expiring Soon' | 'Expired';
};
