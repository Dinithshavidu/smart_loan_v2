export type Role = 'SUPER_ADMIN' | 'PROVIDER' | 'COLLECTOR' | 'CUSTOMER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  company_id: number | null;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

export interface LoanType {
  id: number;
  name: string;
  term_value: number;
  term_unit: 'day' | 'month';
  interest_rate: number;
  late_fee_value: number;
  late_fee_unit: 'day' | 'year';
  late_fee_rate: number;
}
