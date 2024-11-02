import { UserAttributes } from "../database/models/user";

declare global {
  namespace Express {
    interface Request {
      user?: UserAttributes;
    }
  }
}
