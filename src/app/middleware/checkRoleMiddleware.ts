import { Request, Response, NextFunction } from "express";
import { JwtPayload } from "jsonwebtoken";

interface CustomRequest extends Request {
  user?: JwtPayload | any;
}

const checkRole = (requiredRole: string | string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user || !user.role) {
      return res.status(403).json({
        status: 403,
        message: "Anda tidak memiliki akses untuk melakukan tindakan ini",
      });
    }

    const requiredRoles = Array.isArray(requiredRole)
      ? requiredRole
      : [requiredRole];

    if (!requiredRoles.includes(user.role)) {
      return res.status(403).json({
        status: 403,
        message: "Anda tidak memiliki akses untuk melakukan tindakan ini",
      });
    }

    next();
  };
};

export default checkRole;
