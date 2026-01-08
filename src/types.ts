export type InventoryItem = {
  id: string;
  name: string;
  image?: string;
  expiryDate: string; // ISO format YYYY-MM-DD
  quantity: number;
  unit: 'pkg' | 'kg' | 'l' | 'pcs' | 'g' | 'ml';
  category: 'Dairy' | 'Grain' | 'Vegetable' | 'Meat' | 'Other';
  isOpened: boolean;
  openedDate?: string;
  status: 'Good' | 'Expiring Soon' | 'Expired';
  // Reminder settings
  reminderDays: number;      // Days before expiry to send reminder (0 = no reminder)
  reminderEmail?: string;    // Email address for notifications
  reminderPhone?: string;    // Phone number for WhatsApp notifications
  reminderSent?: boolean;    // Track if reminder was sent for this cycle
};

