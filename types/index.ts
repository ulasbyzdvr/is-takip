export interface Company {
  id: string;
  name: string;
  createdAt: string;
}

export interface Work {
  id: string;
  companyId: string;
  amount: number;
  description: string;
  imageUri?: string;
  createdAt: string;
}

