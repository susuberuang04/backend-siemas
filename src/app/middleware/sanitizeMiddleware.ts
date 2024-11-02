import { Request, Response, NextFunction } from "express";
import xss from "xss";

const sanitizeObject = (obj: Record<string, any>): Record<string, any> => {
  const sanitizedObj: Record<string, any> = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitizedObj[key] =
        typeof obj[key] === "string" ? xss(obj[key]) : obj[key];
    }
  }
  return sanitizedObj;
};

export const sanitizeMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};
