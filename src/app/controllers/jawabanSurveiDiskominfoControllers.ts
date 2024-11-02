import { Request, Response } from "express";
import { models, sequelize } from "../../database/models";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import fsLink from "fs";
import { Opd } from "../../database/models/opd";
import { User } from "../../database/models/user";
const { JawabanSurveiKominfo } = models;

// Konfigurasi Penyimpanan File
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../public/survei/diskominfo/"));
  },
  filename: (req, file, cb: any) => {
    const userId = req.body.user_id;
    if (!userId) {
      return cb(new Error("User ID tidak ditemukan di request body"));
    }
    cb(
      null,
      `${userId}_${file.fieldname}-${Date.now()}${path.extname(
        file.originalname
      )}`
    );
  },
});

// Filter File (Validasi Ekstensi)
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = [".pdf", ".docx", ".doc", ".xls", ".xlsx"];
  const extname = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(extname)) {
    cb(null, true);
  } else {
    cb(new Error(`Format tidak valid untuk ${file.fieldname}`));
  }
};

// Konfigurasi Upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
}).any(); // Tidak ada batas jumlah file

const handleValidationFailure = async (
  files: Express.Multer.File[],
  errorMessage: string,
  res: Response
) => {
  await Promise.all(files.map((file) => fs.unlink(file.path)));
  return res.status(400).json({
    success: false,
    status: 400,
    message: { error: errorMessage },
  });
};

const getMimeType = (fileName: string): string => {
  const ext = fileName.split(".").pop();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    // Tambahkan tipe MIME lain sesuai kebutuhan
    default:
      return "application/octet-stream"; // Tipe default
  }
};

const JawabanSurveiDiskominfoController = {
  // createSurveiKementrian: async (req: Request, res: Response) => {
  //   const transaction = await sequelize.transaction();
  //   try {
  //     upload(req, res, async (err) => {
  //       if (err) {
  //         return handleValidationFailure(
  //           req.files as Express.Multer.File[],
  //           err.message,
  //           res
  //         );
  //       }

  //       const files = req.files as Express.Multer.File[] | undefined;
  //       const { user_id, nama_lengkap, email, instansi, jabatan, alamat } =
  //         req.body;

  //       // Validasi input
  //       if (
  //         !user_id ||
  //         !nama_lengkap ||
  //         !email ||
  //         !instansi ||
  //         !jabatan ||
  //         !alamat
  //       ) {
  //         return res.status(400).json({
  //           success: false,
  //           status: 400,
  //           message: { error: "Tidak Boleh Kosong!" },
  //         });
  //       }

  //       // Pastikan files ada dan merupakan array
  //       if (!Array.isArray(files)) {
  //         return res.status(400).json({
  //           success: false,
  //           message: "Tidak ada file yang diunggah.",
  //         });
  //       }

  //       // Format jawaban untuk mengikuti struktur yang diminta
  //       const jawaban = Object.keys(req.body)
  //         .filter((key) => key.startsWith("pertanyaan_"))
  //         .map((key) => {
  //           const pertanyaanKey = key;
  //           const pertanyaanText = req.body[pertanyaanKey];
  //           const jawabanText =
  //             req.body[`jawaban_${pertanyaanKey.replace("pertanyaan_", "")}`];

  //           return {
  //             pertanyaan: pertanyaanText,
  //             jawaban: jawabanText,
  //           };
  //         });

  //       const formattedResponse = {
  //         user_id,
  //         nama_lengkap,
  //         email,
  //         instansi,
  //         jabatan,
  //         alamat,
  //         jawaban,
  //       };

  //       const newEntry = await JawabanSurveiKominfo.create(
  //         {
  //           user_id,
  //           jawaban_survei: JSON.stringify(formattedResponse),
  //         },
  //         { transaction }
  //       );

  //       await transaction.commit();

  //       res.status(201).json({
  //         success: true,
  //         data: newEntry,
  //         message: "Jawaban survei berhasil disimpan.",
  //       });
  //     });
  //   } catch (error: any) {
  //     await transaction.rollback();
  //     res.status(500).json({
  //       success: false,
  //       message: error.message || "Terjadi kesalahan pada server.",
  //     });
  //   }
  // },
  createSurveiKementrian: async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
      const { user_id, nama_lengkap, email, instansi, jabatan, alamat } =
        req.body;

      // Validasi input
      if (
        !user_id ||
        !nama_lengkap ||
        !email ||
        !instansi ||
        !jabatan ||
        !alamat
      ) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: { error: "Tidak Boleh Kosong!" },
        });
      }

      // Format jawaban sesuai struktur yang diminta
      const jawaban = Object.keys(req.body)
        .filter((key) => key.startsWith("pertanyaan_"))
        .map((key) => {
          const pertanyaanText = req.body[key];
          const jawabanText =
            req.body[`jawaban_${key.replace("pertanyaan_", "")}`];

          return {
            pertanyaan: pertanyaanText,
            jawaban: jawabanText,
          };
        });

      const formattedResponse = {
        user_id,
        nama_lengkap,
        email,
        instansi,
        jabatan,
        alamat,
        jawaban,
      };

      const newEntry = await JawabanSurveiKominfo.create(
        {
          user_id,
          jawaban_survei: JSON.stringify(formattedResponse),
        },
        { transaction }
      );

      await transaction.commit();

      res.status(201).json({
        success: true,
        data: newEntry,
        message: "Jawaban survei berhasil disimpan.",
      });
    } catch (error: any) {
      await transaction.rollback();
      res.status(500).json({
        success: false,
        message: error.message || "Terjadi kesalahan pada server.",
      });
    }
  },

  getAllSudahMenguploadUniqueSuperadmin: async (
    req: Request,
    res: Response
  ) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }

    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows: jawabanSurveiKementrian }: any =
        await JawabanSurveiKominfo.findAndCountAll({
          limit,
          offset,
          order: [["createdAt", "DESC"]],
        });

      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      if (jawabanSurveiKementrian.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data OPD Tidak Ditemukan",
        });
      }

      const hasil: any = [];

      for (const jawaban of jawabanSurveiKementrian) {
        const user: any = await User.findByPk(jawaban.user_id);
        console.log(user);
        if (!user) {
          continue;
        }

        const opd: any = await Opd.findByPk(user.opd_id);

        if (opd) {
          hasil.push({
            id: jawaban.id,
            user_id: user.id,
            nama_opd: opd.nama_opd,
          });
        }
      }

      res.status(200).json({
        success: true,
        message: "Data survei berhasil diambil.",
        result: hasil,
        total_data: totalData,
        total_pages: totalPages,
        page,
        limit,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Terjadi kesalahan pada server.",
      });
    }
  },

  getAllByUserId: async (req: Request, res: Response) => {
    const { user_id } = req.params;
    try {
      const jawabanSurveiKementrian: any = await JawabanSurveiKominfo.findAll({
        where: {
          user_id: user_id,
        },
      });

      if (jawabanSurveiKementrian.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Data Survei Tidak Ditemukan",
        });
      }

      res.status(200).json({
        success: true,
        message: "Data survei berhasil diambil.",
        result: jawabanSurveiKementrian,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Terjadi kesalahan pada server.",
      });
    }
  },

  // showFileData: async (req: Request, res: Response) => {
  //   const { user_id } = req.params;
  //   try {
  //     const jawabanSurveiKementrian: any = await JawabanSurveiKominfo.findAll({
  //       where: {
  //         user_id: user_id,
  //       },
  //     });

  //     if (jawabanSurveiKementrian.length === 0) {
  //       return res.status(404).json({
  //         success: false,
  //         status: 404,
  //         message: "Data Survei Tidak Ditemukan",
  //       });
  //     }

  //     // Proses data untuk mendapatkan file PDF dan MIME type
  //     const responseData = jawabanSurveiKementrian.map((item: any) => {
  //       const parsedJawaban = JSON.parse(item.jawaban_survei); // Memastikan kita mem-parsing string JSON

  //       return parsedJawaban.map((jawabanItem: any) => {
  //         const result: any = {
  //           jawaban: jawabanItem.jawaban_pertanyaan, // Ambil jawaban pertanyaan
  //           catatan: jawabanItem.catatan, // Ambil catatan
  //           bukti_dukung: [], // Inisialisasi array bukti dukung
  //         };

  //         // Memeriksa bukti dukung
  //         if (jawabanItem.bukti_dukung && jawabanItem.bukti_dukung.length > 0) {
  //           jawabanItem.bukti_dukung.forEach((file: string) => {
  //             const mimeType = getMimeType(file);

  //             if (mimeType === "application/pdf") {
  //               result.bukti_dukung.push({
  //                 file: file,
  //                 mimeType: mimeType,
  //                 keterangan: null,
  //               });
  //             } else {
  //               result.bukti_dukung.push({
  //                 file: file,
  //                 mimeType: mimeType,
  //                 keterangan: "FORMAT BUKAN .PDF",
  //               });
  //             }
  //           });
  //         }

  //         return result;
  //       });
  //     });

  //     // Rata-rata jawaban untuk setiap item
  //     const flattenedData = responseData.flat(); // Flatten array

  //     // Filter hanya yang memiliki bukti dukung PDF atau keterangan
  //     const filteredData = flattenedData.filter(
  //       (item: any) => item.bukti_dukung.length > 0
  //     );

  //     if (filteredData.length === 0) {
  //       return res.status(404).json({
  //         success: false,
  //         status: 404,
  //         message: "Tidak ada file yang ditemukan.",
  //       });
  //     }

  //     // Menampilkan hasil akhir
  //     res.status(200).json({
  //       success: true,
  //       message: "Data survei berhasil diambil.",
  //       result: filteredData,
  //     });
  //   } catch (error: any) {
  //     res.status(500).json({
  //       success: false,
  //       message: error.message || "Terjadi kesalahan pada server.",
  //     });
  //   }
  // },
  // showBuktiDukung: async (req: Request, res: Response) => {
  //   const { filename } = req.params; // Ambil nama file dari parameter URL
  //   try {
  //     const regulasiPath = path.join(
  //       __dirname,
  //       "../../public/survei/kementrian",
  //       filename
  //     );

  //     if (!fsLink.existsSync(regulasiPath)) {
  //       return res.status(404).json({
  //         success: false,
  //         status: 404,
  //         message: {
  //           error: "File regulasi tidak ditemukan",
  //         },
  //       });
  //     }
  //     res.sendFile(regulasiPath);
  //   } catch (error: any) {
  //     res.status(500).json({
  //       success: false,
  //       status: 500,
  //       message: "Terjadi kesalahan dalam memproses permintaan",
  //     });
  //   }
  // },
};

export default JawabanSurveiDiskominfoController;
