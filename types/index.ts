export interface Company {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
}

export type Currency = 'TRY' | 'USD' | 'EUR';

export interface Work {
  id: string;
  companyId: string;
  amount: number;
  currency: Currency;
  date: string;
  description: string;
  imageUri?: string;
  isPaid: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

