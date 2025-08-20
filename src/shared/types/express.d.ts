import { Request } from 'express';

export interface CustomRequest extends Request {
  user?: {
    id: number;
    role: string;
    name?: string;
    email?: string;
  };
}
