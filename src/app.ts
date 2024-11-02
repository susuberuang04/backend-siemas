import { Request, Response, NextFunction } from "express";
import express from "express";
import cors from "cors";
import fs from "fs";
import helmet from "helmet";
import path from "path";
import morgan from "morgan";
import bodyParser from "body-parser";
import opdRoutes from "./routes/opdRoutes";
import userRoutes from "./routes/userRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import kategoriRoutes from "./routes/kategoriRoutes";
import usulanSmartRoutes from "./routes/usulanSmartRoutes";
import feedBackRoutes from "./routes/feedBackRoutes";
import progresRoutes from "./routes/progresRoutes";
import trackingRoutes from "./routes/trackingRoutes";
import logErrorRoutes from "./routes/logErrorRoutes";
import notifikasiRoutes from "./routes/notifikasiRoutes";
import historyPenghapusanRoutes from "./routes/historyRoutes";
import klasifikasiSurveiRoutes from "./routes/klasifikasiSurveiRoutes";
import kegiatanSurveiRoutes from "./routes/kegiatanSurveiRoutes";
import pertanyaanSurveiRoutes from "./routes/pertanyaanSurveiRoutes";
import jawabanPertanyaanSurveiRoutes from "./routes/JawabanPertanyaanSurveiRoutes";
import jawabansurveiKementrianRoutes from "./routes/jawabanSurveiKementrian";
import sequelizeKoneksi from "./database/config/connection";
import { sanitizeMiddleware } from "./app/middleware/sanitizeMiddleware";
import { Server as SocketIOServer } from "socket.io";
import http from "http";
require("dotenv").config();

const app = express();
const port = 8000;
// be
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.URL_HOSTING,
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

io.on("connection", (socket: any) => {
  console.log("user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal Server Error" });
};

function logToFile(logMessage: string) {
  const logDirectory = path.join(__dirname, "utils", "logs");
  const today = new Date();
  const logFileName = `${today.getFullYear()}-${
    today.getMonth() + 1
  }-${today.getDate()}.log`;
  const logFilePath = path.join(logDirectory, logFileName);

  if (!fs.existsSync(logFilePath)) {
    const header = `== ${today.getDate()}-${
      today.getMonth() + 1
    }-${today.getFullYear()} ===\n`;
    fs.writeFileSync(logFilePath, header);
  }
  fs.appendFileSync(logFilePath, logMessage + "\n");
}

const accessLogStream = {
  write: function (message: string) {
    logToFile(message.trim());
  },
};

app.use(
  morgan(
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
    { stream: accessLogStream }
  )
);
app.use(helmet());
app.use(bodyParser.json());
app.use(cors());
app.use(errorHandler);
app.use(sanitizeMiddleware);

app.get("/", (req, res) => {
  res.send("Sistem informasi evaluasi smart city");
});

sequelizeKoneksi
  .authenticate()
  .then(() => {
    console.log("Koneksi ke basis data berhasil.");
  })
  .catch((err: Error) => {
    console.error("Tidak dapat terhubung ke basis data:", err);
    process.exit(1); // Keluar dari proses dengan kode kesalahan
  });

app.use("/api/opd", opdRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/user", userRoutes);
app.use("/api/kategori", kategoriRoutes);
app.use("/api/usulan", usulanSmartRoutes);
app.use("/api/feedback", feedBackRoutes);
app.use("/api/progres", progresRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/log", logErrorRoutes);
app.use("/api/history", historyPenghapusanRoutes);
app.use("/api/notifikasi", notifikasiRoutes);
app.use("/api/klasifikasi-survei", klasifikasiSurveiRoutes);
app.use("/api/kegiatan-survei", kegiatanSurveiRoutes);
app.use("/api/pertanyaan-survei", pertanyaanSurveiRoutes);
app.use("/api/jawaban-pertanyaan", jawabanPertanyaanSurveiRoutes);
app.use("/api/survei-kementrian", jawabansurveiKementrianRoutes);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export { io };
