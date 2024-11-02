import { Request, Response, NextFunction } from "express";
import { models, sequelize } from "../../database/models";
const { Progres, Kategori, Tracking, UsulanSmart, HistoryPenghapusan } = models;
import { io } from "../../app";
import multer from "multer";
import path from "path";
import fs from "fs";
import { LogError } from "../../database/models/logerror";
import { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../../database/models/user";
import mime from "mime-types";

const { Op } = require("sequelize");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public/foto-dokumentasi/"));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const fileFilter = function (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) {
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".heic", ".pdf"];
  const extname = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(extname)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Ekstensi file tidak valid. Harap unggah file gambar dengan ekstensi PNG, JPG, JPEG, atau HEIC."
      )
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

interface CustomRequest extends Request {
  user?: JwtPayload | any;
}

const ProgressKegiatanController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }

    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await Progres.findAndCountAll({
        limit,
        offset,
        include: [
          {
            model: UsulanSmart,
            as: "usulanSmarts",
          },
        ],
      });
      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      if (rows.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data Progress Tidak Ditemukan",
        });
      }

      const response = {
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: rows,
        page: page,
        total_pages: totalPages,
        total_data: totalData,
      };

      res.status(200).json(response);
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const getOpdById = await Progres.findOne({
        where: { id },
        include: [
          {
            model: UsulanSmart,
            as: "usulanSmarts",
          },
        ],
      });

      if (!getOpdById) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Progress Kegiatan Tidak Ditemukan",
          },
        });
      }

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: getOpdById,
      });
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },
  getAllByUserId: async (req: Request, res: Response, next: NextFunction) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;
    const { user_id } = req.params;

    try {
      const { count, rows }: any = await Progres.findAndCountAll({
        limit,
        offset,
        where: {
          user_id: user_id,
        },
        include: [
          {
            model: UsulanSmart,
            as: "usulanSmarts",
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data tidak ditemukan",
          },
        });
      }

      const response = {
        success: true,
        status: 200,
        message: "Data ditemukan",
        result: rows,
        page: page,
        total_pages: totalPages,
        total_data: totalData,
      };
      return res.status(200).json(response);
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },

  showBuktiDukungProgresKegiatanByDetailId: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { nama_file } = req.params;

    try {
      const getFileKegiatanProgres: any = await Progres.findOne({
        where: {
          foto_kegiatan: nama_file,
        },
      });

      if (!getFileKegiatanProgres) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "File Progres Kegiatan tidak ditemukan di database",
        });
      }

      const regulasiPath = path.join(
        __dirname,
        "../../public/foto-dokumentasi",
        getFileKegiatanProgres.foto_kegiatan
      );

      if (!fs.existsSync(regulasiPath)) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "File Progres Kegiatan tidak ditemukan di path",
        });
      }

      res.sendFile(regulasiPath);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        success: false,
        status: 500,
        message: error.stack,
      });
    }
  },

  getAllByUserIdAndUsulanID: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { user_id, usulan_id } = req.params;

    try {
      const responseData: any = await Progres.findAll({
        where: {
          user_id: user_id,
          usulan_id: usulan_id,
        },
        include: [
          {
            model: UsulanSmart,
            as: "usulanSmarts",
          },
        ],
      });

      if (responseData.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data tidak ditemukan",
          },
        });
      }

      const processedRows = await Promise.all(
        responseData.map(async (progressItem: any) => {
          const item = progressItem.toJSON(); // Convert to plain object to avoid circular references
          const filePath = path.join(
            __dirname,
            "../../public/foto-dokumentasi",
            item.foto_kegiatan
          );

          let base64Image = "";
          let mimeType = "application/octet-stream";

          if (fs.existsSync(filePath)) {
            mimeType = mime.lookup(filePath) || mimeType;
            const imageBuffer = fs.readFileSync(filePath);
            base64Image = `data:${mimeType};base64,${imageBuffer.toString(
              "base64"
            )}`;
          }

          return {
            ...item,
            foto_kegiatan: base64Image,
            tipe_file: mimeType,
          };
        })
      );

      const response = {
        success: true,
        status: 200,
        message: "Data ditemukan",
        result: processedRows,
      };
      return res.status(200).json(response);
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },

  getAllByUserIdAndUsulanIDWithBase: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string, 10);
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const offset = (page - 1) * limit;

    const { user_id, usulan_id } = req.params;

    try {
      const { count, rows }: any = await Progres.findAndCountAll({
        limit,
        offset,
        where: {
          user_id: user_id,
          usulan_id: usulan_id,
        },
        include: [
          {
            model: UsulanSmart,
            as: "usulanSmarts",
            attributes: ["nama_inovasi"],
            include: [
              {
                model: Kategori,
                as: "kategori",
                attributes: ["id", "jenis_smart"],
              },
            ],
          },
        ],
      });

      if (!Array.isArray(rows)) {
        throw new Error("Unexpected data format");
      }

      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      // Process each item to include Base64 encoded foto_kegiatan
      const processedRows = await Promise.all(
        rows.map(async (progressItem: any) => {
          const item = progressItem.toJSON(); // Convert to plain object to avoid circular references
          const filePath = path.join(
            __dirname,
            "../../public/foto-dokumentasi",
            item.foto_kegiatan
          );

          let base64Image = "";
          let mimeType = "application/octet-stream";

          if (fs.existsSync(filePath)) {
            mimeType = mime.lookup(filePath) || mimeType;
            const imageBuffer = fs.readFileSync(filePath);
            base64Image = `data:${mimeType};base64,${imageBuffer.toString(
              "base64"
            )}`;
          }

          return {
            ...item,
            foto_kegiatan: base64Image,
            tipe_file: mimeType,
          };
        })
      );

      const response = {
        success: true,
        status: 200,
        message: "Data ditemukan",
        result: processedRows,
        page: page,
        total_pages: totalPages,
        total_data: totalData,
      };
      return res.status(200).json(response);
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });

      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },

  getAllByUserIdAndUsulanIDOptimasasi: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string, 10);
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const offset = (page - 1) * limit;

    const { user_id, usulan_id } = req.params;

    try {
      const { count, rows }: any = await Progres.findAndCountAll({
        limit,
        offset,
        where: {
          user_id: user_id,
          usulan_id: usulan_id,
        },
        include: [
          {
            model: UsulanSmart,
            as: "usulanSmarts",
            attributes: ["nama_inovasi"],
            include: [
              {
                model: Kategori,
                as: "kategori",
                attributes: ["id", "jenis_smart"],
              },
            ],
          },
        ],
        order: [["tanggal", "ASC"]], // Urutkan berdasarkan kolom 'tanggal' dari terlama ke terbaru
      });

      if (!Array.isArray(rows)) {
        throw new Error("Unexpected data format");
      }

      // Format tanggal
      const formattedRows = rows.map((row: any) => {
        const date = new Date(row.tanggal); // Mengonversi string tanggal ke objek Date
        const options: Intl.DateTimeFormatOptions = {
          day: "numeric",
          month: "long",
          year: "numeric",
        };
        row.tanggal = date.toLocaleDateString("id-ID", options); // Mengubah format tanggal
        return row; // Kembalikan row yang sudah diformat
      });

      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      const response = {
        success: true,
        status: 200,
        message: "Data ditemukan",
        result: formattedRows, // Gunakan formattedRows
        page: page,
        total_pages: totalPages,
        total_data: totalData,
      };
      return res.status(200).json(response);
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });

      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },

  search: async (req: Request, res: Response, next: NextFunction) => {
    const searchTerm = req.query.search;
    const { user_id, usulan_id } = req.params;

    try {
      // Cari data progres berdasarkan user_id dan usulan_id
      const progresList: any = await Progres.findAll({
        where: {
          user_id: user_id,
          usulan_id: usulan_id,
        },
        include: [
          {
            model: UsulanSmart,
            as: "usulanSmarts",
            where: {
              nama_inovasi: {
                [Op.like]: `%${searchTerm}%`,
              },
            },
          },
        ],
      });

      // Filter hasil berdasarkan kecocokan yang tepat dengan search term
      const filteredResults = progresList.filter((progres: any) =>
        progres.usulanSmarts.some(
          (usulan: any) =>
            usulan.nama_inovasi === searchTerm ||
            usulan.nama_inovasi.includes(searchTerm)
        )
      );

      if (filteredResults.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Progres Tidak Ditemukan",
          },
        });
      }

      // Proses setiap item untuk menyertakan foto_kegiatan yang dienkode ke Base64
      const processedRows: any = await Promise.all(
        filteredResults.map(async (progressItem: any) => {
          const item = progressItem.toJSON(); // Ubah ke objek plain untuk menghindari referensi melingkar
          const filePath = path.join(
            __dirname,
            "../../public/foto-dokumentasi",
            item.foto_kegiatan
          );

          let base64Image = "";
          let mimeType = "application/octet-stream";

          if (fs.existsSync(filePath)) {
            mimeType = mime.lookup(filePath) || mimeType;
            const imageBuffer = fs.readFileSync(filePath);
            base64Image = `data:${mimeType};base64,${imageBuffer.toString(
              "base64"
            )}`;
          }

          return {
            ...item,
            foto_kegiatan: base64Image,
            tipe_file: mimeType,
          };
        })
      );

      const response = {
        success: true,
        status: 200,
        message: "Data ditemukan",
        result: processedRows,
      };
      return res.status(200).json(response);
    } catch (error: any) {
      console.log(error);
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });

      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },

  // search: async (req: Request, res: Response, next: NextFunction) => {
  //   const searchTerm = req.query.search;
  //   const { user_id, usulan_id } = req.params;

  //   try {
  //     const getSearch = await Progres.findAll({
  //       where: {
  //         user_id: user_id,
  //         usulan_id: usulan_id,
  //       },
  //       include: [
  //         {
  //           model: UsulanSmart,
  //           as: "usulanSmarts",
  //           where: {
  //             nama_inovasi: {
  //               [Op.like]: `%${searchTerm}%`,
  //             },
  //           },
  //         },
  //       ],
  //     });

  //     if (getSearch.length === 0) {
  //       return res.status(404).json({
  //         success: true,
  //         status: 404,
  //         message: {
  //           error: "Data Progres Tidak Ditemukan",
  //         },
  //       });
  //     }

  //     res.status(200).json({
  //       success: true,
  //       status: 200,
  //       message: "Data Ditemukan",
  //       result: getSearch,
  //     });
  //   } catch (error: any) {
  //     res.status(500).json({
  //       success: false,
  //       status: 500,
  //       message: {
  //         error: error,
  //       },
  //     });
  //   }
  // },

  createProgres: async (req: Request, res: Response, next: NextFunction) => {
    upload.single("foto_kegiatan")(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Batas Upload Dokumentasi Kegiatan 2MB !",
            },
          });
        } else {
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Terjadi Kesalahan Kegiatan",
            },
          });
        }
      } else if (err) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: err.message,
          },
        });
      }
      const transaction = await sequelize.transaction();
      const { user_id, usulan_id, tanggal, deskripsi_kegiatan } = req.body;
      const foto_kegiatan = req.file ? req.file.filename : null;

      try {
        if (
          !user_id &&
          !usulan_id &&
          !tanggal &&
          !deskripsi_kegiatan &&
          !foto_kegiatan
        ) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }

          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Harap Di Isi Semua",
            },
          });
        }

        if (!user_id) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Id User Tidak Boleh Kosong!",
            },
          });
        }

        if (!usulan_id) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Usulan Id Tidak Boleh Kosong!",
            },
          });
        }

        if (!tanggal) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Tanggal Tidak Boleh Kosong!",
            },
          });
        }

        if (!deskripsi_kegiatan) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Deskripsi Kegiatan Tidak Boleh Kosong!",
            },
          });
        }

        if (!foto_kegiatan) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Foto Kegiatan Tidak Boleh Kosong!",
            },
          });
        }

        const newProgressKategori = await Progres.create(
          {
            user_id,
            usulan_id,
            tanggal,
            deskripsi_kegiatan,
            foto_kegiatan,
          },
          { transaction }
        );

        const getNamaInovasi: any | null = await UsulanSmart.findOne({
          where: {
            id: usulan_id,
            user_id: user_id,
          },
        });

        if (getNamaInovasi && getNamaInovasi.nama_inovasi) {
          await Tracking.create(
            {
              user_id: user_id,
              usulan_id: usulan_id,
              keterangan:
                "Menambahkan Progres Pada Inovasi " +
                getNamaInovasi.nama_inovasi,
            },
            { transaction }
          );
        }

        await transaction.commit();

        io.emit("progressAdded", newProgressKategori);
        res.status(201).json({
          success: true,
          status: 201,
          message: "Progress berhasil ditambahkan",
          result: newProgressKategori,
        });
      } catch (error: any) {
        await LogError.create({
          jenis_akses: "backend",
          error_message: error.message,
          stack_trace: error.stack,
        });
        await transaction.rollback();
        res.status(500).json({
          success: false,
          status: 500,
          message: {
            error: error,
          },
        });
      }
    });
  },
  editProgres: async (req: Request, res: Response, next: NextFunction) => {
    upload.single("foto_kegiatan")(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Batas Upload Dokumentasi Kegiatan 2MB !",
            },
          });
        } else {
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Terjadi Kesalahan Kegiatan",
            },
          });
        }
      } else if (err) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: err.message,
          },
        });
      }
      const transaction = await sequelize.transaction();
      const progresId = req.params.id;

      const existingProgress: any = await Progres.findByPk(progresId);

      const { user_id, usulan_id, tanggal, deskripsi_kegiatan } = req.body;
      const foto_kegiatan = req.file
        ? req.file.filename
        : existingProgress?.foto_kegiatan;

      try {
        if (
          !user_id &&
          !usulan_id &&
          !tanggal &&
          !deskripsi_kegiatan &&
          !foto_kegiatan
        ) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }

          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Harap Di Isi Semua",
            },
          });
        }

        if (!user_id) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Id User Tidak Boleh Kosong!",
            },
          });
        }

        if (!usulan_id) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Usulan Id Tidak Boleh Kosong!",
            },
          });
        }

        if (!tanggal) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Tanggal Tidak Boleh Kosong!",
            },
          });
        }

        if (!deskripsi_kegiatan) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Deskripsi Kegiatan Tidak Boleh Kosong!",
            },
          });
        }

        if (!foto_kegiatan) {
          if (req.file) {
            fs.unlink(req.file.path, (err) => {
              if (err) {
                console.error("Error deleting file:", err);
              }
            });
          }
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Foto Kegiatan Tidak Boleh Kosong!",
            },
          });
        }

        await existingProgress.update(
          {
            user_id,
            usulan_id,
            tanggal,
            deskripsi_kegiatan,
            foto_kegiatan,
          },
          { transaction }
        );
        await Tracking.create(
          {
            user_id: existingProgress.user_id,
            usulan_id: existingProgress.id,
            keterangan: "Mengupdate Data Progres",
          },
          { transaction }
        );
        await transaction.commit();

        io.emit("progresEdited", existingProgress);
        res.status(201).json({
          success: true,
          status: 201,
          message: "Progress berhasil diperbaharui",
          result: existingProgress,
        });
      } catch (error: any) {
        await LogError.create({
          jenis_akses: "backend",
          error_message: error.message,
          stack_trace: error.stack,
        });
        await transaction.rollback();
        res.status(500).json({
          success: false,
          status: 500,
          message: {
            error: error,
          },
        });
      }
    });
  },

  deleteProgres: async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    const transaction = await sequelize.transaction();
    const { alasan_penghapusan, password, keywords } = req.body;
    const idPengguna = req.user.userId;
    const namaPengguna = req.user.nama_lengkap;

    try {
      const { id } = req.params;
      if (!keywords || !alasan_penghapusan || !password) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "keywords, alasan penghapusan, password tidak boleh kosong",
          },
        });
      }

      const getDataUser: any = await User.findByPk(idPengguna);

      if (!getDataUser) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "User Tidak Ditemukan",
          },
        });
      }

      // Validasi keywords
      if (keywords !== "delete/my-progress") {
        return res.status(403).json({
          success: false,
          status: 403,
          message: {
            error: "Masukkan Keywords Sesuai Arahan",
          },
        });
      }

      // Validasi password
      const isPasswordValid = await bcrypt.compare(
        password,
        getDataUser.password
      );

      if (!isPasswordValid) {
        return res.status(403).json({
          success: false,
          message: {
            error: "Password Salah",
          },
        });
      }

      const getDataProgres: any = await Progres.findByPk(id);

      if (!getDataProgres) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Tersebut Tidak Ada",
          },
        });
      }

      const getNamaInovasi: any = await UsulanSmart.findByPk(
        getDataProgres?.usulan_id
      );

      console.log(getNamaInovasi);

      await getDataProgres.destroy();

      await Tracking.create({
        user_id: getDataProgres.user_id,
        usulan_id: getDataProgres.usulan_id,
        keterangan:
          "Menghapus Data Progres dari inovasi " + getNamaInovasi?.nama_inovasi,
      });

      await HistoryPenghapusan.create({
        id_user: idPengguna,
        id_usulan: getDataProgres.id,
        nama_data: getNamaInovasi?.nama_inovasi,
        tipe_data: "Entry Data",
        status: "Hapus Sementara",
        nama_tabel: "Tabel Progress",
        nama_pengguna: namaPengguna,
        alasan_penghapusan: alasan_penghapusan.toLowerCase(),
      });

      await transaction.commit();
      io.emit("progresDeleted", id);

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Berhasil Di Hapus",
        invalidateCache: true,
      });
    } catch (error: any) {
      console.error(error);
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: "Internal Server Error",
        },
      });
    }
  },
  deleteProgresPermanen: async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    const transaction = await sequelize.transaction();
    const { alasan_penghapusan, password, keywords } = req.body;
    const idPengguna = req.user.userId;
    const namaPengguna = req.user.nama_lengkap;

    try {
      const { id } = req.params;
      if (!keywords || !alasan_penghapusan || !password) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "keywords, alasan penghapusan, password tidak boleh kosong",
          },
        });
      }

      const getDataUser: any = await User.findByPk(idPengguna);

      if (!getDataUser) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "User Tidak Ditemukan",
          },
        });
      }

      // Validasi keywords
      if (keywords !== "deletepermanen/my-progress") {
        return res.status(403).json({
          success: false,
          status: 403,
          message: {
            error: "Masukkan Keywords Sesuai Arahan",
          },
        });
      }

      // Validasi password
      const isPasswordValid = await bcrypt.compare(
        password,
        getDataUser.password
      );

      if (!isPasswordValid) {
        return res.status(403).json({
          success: false,
          message: {
            error: "Password Salah",
          },
        });
      }

      const getDataProgres: any = await Progres.findByPk(id, {
        paranoid: false,
      });

      if (!getDataProgres) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Tersebut Tidak Ada",
          },
        });
      }

      if (getDataProgres.foto_kegiatan) {
        const regulasiPath = path.join(
          __dirname,
          "../../public/foto-dokumentasi/",
          getDataProgres.foto_kegiatan
        );
        if (fs.existsSync(regulasiPath)) {
          fs.unlinkSync(regulasiPath);
        }
      }

      const getNamaInovasi: any = await UsulanSmart.findByPk(
        getDataProgres?.usulan_id
      );

      await getDataProgres.destroy({
        force: true,
      });

      await Tracking.create({
        user_id: getDataProgres.user_id,
        usulan_id: getDataProgres.usulan_id,
        keterangan:
          "Menghapus Secara Permanen Data Progres Dari Inovasi " +
          getNamaInovasi?.nama_inovasi,
      });

      console.log("ini datanya", getNamaInovasi);

      await HistoryPenghapusan.create({
        id_user: idPengguna,
        id_usulan: getDataProgres.id,
        nama_data: getNamaInovasi.dataValues.nama_inovasi,
        tipe_data: "Entry Data",
        status: "Hapus Sementara",
        nama_tabel: "Tabel Progress",
        nama_pengguna: namaPengguna,
        alasan_penghapusan: alasan_penghapusan.toLowerCase(),
      });

      await transaction.commit();
      io.emit("progresDeleted", id);

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Berhasil Di Hapus Secara Permanen",
        invalidateCache: true,
      });
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: "Internal Server Error",
        },
      });
    }
  },
  restoreProgres: async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    const transaction = await sequelize.transaction();
    const { alasan_penghapusan, password, keywords } = req.body;
    const idPengguna = req.user.userId;
    const namaPengguna = req.user.nama_lengkap;
    try {
      const { id } = req.params;

      if (!keywords || !alasan_penghapusan || !password) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "keywords, alasan penghapusan, password tidak boleh kosong",
          },
        });
      }

      const getDataUser: any = await User.findByPk(idPengguna);

      if (!getDataUser) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "User Tidak Ditemukan",
          },
        });
      }

      if (keywords !== "restore/my-progress") {
        return res.status(403).json({
          success: false,
          status: 403,
          message: {
            error: "Masukkan Keywords Sesuai Arahan",
          },
        });
      }

      // Validasi password
      const isPasswordValid = await bcrypt.compare(
        password,
        getDataUser.password
      );

      if (!isPasswordValid) {
        return res.status(403).json({
          success: false,
          message: {
            error: "Password Salah",
          },
        });
      }

      const getDataProgres: any = await Progres.findByPk(id, {
        paranoid: false,
      });

      if (!getDataProgres) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Tersebut Tidak Ada",
          },
        });
      }

      const getNamaInovasi: any = await UsulanSmart.findByPk(
        getDataProgres?.usulan_id
      );

      await Tracking.create({
        user_id: getDataProgres.user_id,
        usulan_id: getDataProgres.usulan_id,
        keterangan:
          "Memulihkan Data Progres dari inovasi " +
          getNamaInovasi?.nama_inovasi,
      });

      await HistoryPenghapusan.create({
        id_user: idPengguna,
        id_usulan: getDataProgres.id,
        nama_data: getNamaInovasi.dataValues.nama_inovasi,
        tipe_data: "Entry Data",
        status: "Dipulihkan",
        nama_tabel: "Tabel Progress",
        nama_pengguna: namaPengguna,
        alasan_penghapusan: alasan_penghapusan.toLowerCase(),
      });

      await getDataProgres.restore();

      await Tracking.create({
        user_id: getDataProgres.user_id,
        usulan_id: getDataProgres.usulan_id,
        keterangan: "Memulihkan Data Progres",
      });

      await transaction.commit();
      io.emit("progresRestored", id);

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Berhasil Dipulihkan",
        result: getDataProgres,
      });
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: "Internal Server Error",
        },
      });
    }
  },
  showFotoKegiatan: async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
      const progress: any = await Progres.findByPk(id);

      if (!progress) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "progress tidak ditemukan",
        });
      }

      const fotoName = progress.foto_kegiatan;

      const filePath = path.join(
        __dirname,
        "../../public/foto-dokumentasi/",
        fotoName
      );

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Foto Kegiatan tidak ditemukan",
          },
        });
      }

      res.sendFile(filePath);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        status: 500,
        message: "Terjadi kesalahan dalam memproses permintaan",
      });
    }
  },
  showFotoKegiatanByLaporan: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.params;

    try {
      const progress: any = await Progres.findByPk(id);

      if (!progress) {
        console.log("Progress not found");
        return res.status(404).json({
          success: false,
          status: 404,
          message: "progress tidak ditemukan",
        });
      }

      const fotoName = progress.foto_kegiatan;
      const filePath = path.join(
        __dirname,
        "../../public/foto-dokumentasi/",
        fotoName
      );

      if (!fs.existsSync(filePath)) {
        console.log("File not found");
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Foto Kegiatan tidak ditemukan",
          },
        });
      }

      const mimeType = mime.lookup(filePath);

      // Check if the file is a PDF or an image
      const isPdf = mimeType === "application/pdf";
      const isImage = mimeType && mimeType.startsWith("image/");

      console.log(`Serving file: ${filePath} with mime type: ${mimeType}`);

      if (isPdf || isImage) {
        return res.sendFile(filePath, {
          headers: { "Content-Type": mimeType },
        });
      } else {
        return res.download(filePath, fotoName);
      }
    } catch (error) {
      console.error("Error processing request:", error);
      return res.status(500).json({
        success: false,
        status: 500,
        message: "Terjadi kesalahan dalam memproses permintaan",
      });
    }
  },
};

export default ProgressKegiatanController;
