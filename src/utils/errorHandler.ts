import { Response } from "express";

export const ErrorHandler = (res: Response, status: number, error: any, message?: string): Response<any, Record<string, any>> => {
  return res.status(status).json(message ? 
    {
    status: status,
    error: error,
    message: message,
    timeStamp: Date.now()
    }
    :
    {
    status: status,
    error: error,
    timeStamp: Date.now()
    }
  );
}