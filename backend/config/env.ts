import dotenv from 'dotenv';

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'finance-secret-key-123';
export const PORT = Number(process.env.PORT || 3000);
