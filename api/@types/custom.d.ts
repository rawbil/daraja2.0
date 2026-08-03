import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      dtoken: string;
      domain: string
    }
  }
}