import { Request, Response, NextFunction } from "express";
import { models, sequelize } from "../../database/models";
import multer from "multer";
import path from "path";
import fs from "fs";
const { Kategori, UsulanSmart } = models;
const { Op } = require("sequelize");
import { io } from "../../app";
import axios from "axios";
require("dotenv").config();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../public/foto-smart/"));
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
  const allowedExtensions = [".png", ".jpg", ".jpeg", ".heic"];
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
});

const KategoriController = {
  retryRequest: async (requestData: any, retryLimit: number = 3) => {
    let retries = 0;
    while (retries < retryLimit) {
      try {
        const response = await axios(requestData);
        return response;
      } catch (error: any) {
        console.error(`Retry request ${retries + 1}: ${error.message}`);
        retries++;
      }
    }
    throw new Error("Exceeded retry limit");
  },

  getAll: async (req: Request, res: Response, next: NextFunction) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }

    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await Kategori.findAndCountAll({
        limit,
        offset,
      });

      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      if (rows.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data Kategori Tidak Ditemukan",
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

      return res.status(200).json(response);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: error,
      });
    }
  },

  search: async (req: Request, res: Response, next: NextFunction) => {
    const searchTerm = req.query.search;

    try {
      const getSearch = await Kategori.findAll({
        where: {
          jenis_smart: {
            [Op.like]: `%${searchTerm}%`,
          },
        },
      });

      if (getSearch.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Kategori Tidak Ditemukan",
          },
        });
      }

      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: getSearch,
      });
    } catch (error: any) {
      res.status(500).json({
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

      const getOpdById = await Kategori.findOne({
        where: { id },
      });

      if (!getOpdById) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Opd Tidak Ditemukan",
          },
        });
      }

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: getOpdById,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },

  tambahKategori: async (req: Request, res: Response, next: NextFunction) => {
    upload.single("foto_smart")(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Terjadi kesalahan saat mengunggah file.",
          },
        });
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

      try {
        const { jenis_smart, deskripsi } = req.body;
        const foto_smart = req.file ? req.file.filename : null;

        if (!jenis_smart && !deskripsi && !foto_smart) {
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

        if (!jenis_smart) {
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
              error: "Jenis Smart Tidak Boleh Kosong!",
            },
          });
        }

        if (!deskripsi) {
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
              error: "Deskripsi Tidak Boleh Kosong!",
            },
          });
        }

        if (!foto_smart) {
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
              error: "Foto Tidak Boleh Kosong!",
            },
          });
        }

        const newKategori = await Kategori.create({
          jenis_smart: jenis_smart.toLowerCase(),
          deskripsi: deskripsi.toLowerCase(),
          foto_smart,
        });

        await transaction.commit();

        io.emit("kategoriAdded", newKategori);

        res.status(201).json({
          success: true,
          status: 201,
          message: "Kategori berhasil ditambahkan",
          result: newKategori,
        });
      } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          status: 500,
          message: {
            error: error,
          },
        });
      }
    });
  },

  editKategori: async (req: Request, res: Response, next: NextFunction) => {
    upload.single("foto_smart")(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Terjadi kesalahan saat mengunggah file.",
          },
        });
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

      try {
        const { jenis_smart, deskripsi } = req.body;
        const kategoriId = req.params.id;

        const existingKategori: any = await Kategori.findByPk(kategoriId);
        const foto_smart = req.file
          ? req.file.filename
          : existingKategori?.foto_smart;

        if (!jenis_smart && !deskripsi && !foto_smart) {
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

        if (!jenis_smart) {
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
              error: "Jenis Smart Tidak Boleh Kosong!",
            },
          });
        }

        if (!deskripsi) {
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
              error: "Deskripsi Tidak Boleh Kosong!",
            },
          });
        }

        // if (!foto_smart) {
        //   if (req.file) {
        //     fs.unlink(req.file.path, (err) => {
        //       if (err) {
        //         console.error("Error deleting file:", err);
        //       }
        //     });
        //   }
        //   return res.status(400).json({
        //     success: false,
        //     status: 400,
        //     message: {
        //       error: "Foto Tidak Boleh Kosong!",
        //     },
        //   });
        // }

        if (!existingKategori) {
          return res.status(404).json({
            success: false,
            status: 404,
            message: {
              error: "Kategori tidak ditemukan",
            },
          });
        }

        await existingKategori.update({
          jenis_smart: jenis_smart.toLowerCase(),
          deskripsi: deskripsi.toLowerCase(),
          foto_smart,
        });

        await transaction.commit();
        io.emit("kategoriEdited", existingKategori);

        res.status(201).json({
          success: true,
          status: 201,
          message: "Kategori berhasil diupdate",
          result: existingKategori,
        });
      } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          status: 500,
          message: {
            error: error,
          },
        });
      }
    });
  },

  deleteKategori: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const usulanSmarts = await UsulanSmart.findAll({
        where: { kategori_id: id },
      });

      for (const usulanSmart of usulanSmarts) {
        await usulanSmart.destroy();
      }

      const getDataById = await Kategori.findByPk(id);
      if (!getDataById) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Kategori tidak ditemukan",
          },
        });
      }

      await getDataById.destroy();

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Kategori berhasil dihapus",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },

  showFoto: async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
      const kategori: any = await Kategori.findByPk(id);

      if (!kategori) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Kategori tidak ditemukan",
        });
      }

      const fotoName = kategori.foto_smart;

      const filePath = path.join(
        __dirname,
        "../../public/foto-smart/",
        fotoName
      );

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
};

export default KategoriController;
