import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface CustomRequest extends Request {
  user?: JwtPayload | any;
}

const JWT_SECRET = process.env.JWT_SECRET || "defaultSecretKey";
const REQUIRED_CUSTOM_HEADER = "X-My-Custom-Header";
const REQUIRED_CUSTOM_HEADER_VALUE =
  process.env.REQUIRED_CUSTOM_HEADER_VALUE || "p2r3g2aknmoifo";

const authMiddleware = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const authorizationHeader = req.header("Authorization");
  const customHeader = req.header(REQUIRED_CUSTOM_HEADER);

  if (!authorizationHeader) {
    return res.status(401).json({
      status: 401,
      message: "Tidak ada header Authorization, otorisasi ditolak",
    });
  }

  if (!customHeader || customHeader !== REQUIRED_CUSTOM_HEADER_VALUE) {
    return res.status(401).json({
      status: 401,
      message: "Header Custom tidak valid, otorisasi ditolak",
    });
  }

  const [bearer, token] = authorizationHeader.split(" ");

  if (bearer !== "Din-kominfo-siEmas-va-l-a-uasi" || !token) {
    return res.status(401).json({
      status: 401,
      message: "Format header Authorization tidak valid, otorisasi ditolak",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: "Token tidak valid",
    });
  }
};

export default authMiddleware;
