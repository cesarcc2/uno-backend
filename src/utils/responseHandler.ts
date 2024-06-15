import { Response } from "express";

export const ResponseHandler = (res: Response, status: number, message: any, data?: any): Response<any, Record<string, any>> => {
    return res.status(status).json(data ? 
      {
      status: status,
      message: message,
      data: data,
      timeStamp: Date.now()
      }
      :
      {
      status: status,
      message: message,
      timeStamp: Date.now()
      }
    );
  }