import { Request, Response, NextFunction, response } from "express";
import { models, sequelize } from "../../database/models";
import multer from "multer";
import path from "path";
import fsLink from "fs";
import mime from "mime-types";
import fs from "fs/promises";
import archiver from "archiver";
import fsEkstra from "fs-extra";
const {
  UsulanSmart,
  User,
  Kategori,
  Opd,
  Tracking,
  Progres,
  HistoryPenghapusan,
  Notifikasi,
} = models;
import { JwtPayload } from "jsonwebtoken";
const { Op } = require("sequelize");
const { QueryTypes } = require("sequelize");

import { io } from "../../app";
import bcrypt from "bcryptjs";
import { LogError } from "../../database/models/logerror";
require("dotenv").config();
import pdf from "html-pdf";
import axios from "axios";
interface AllowedExtensions {
  [key: string]: string[];
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname.startsWith("regulasi")) {
      cb(null, path.join(__dirname, "../../public/usulan-smart/berkas/"));
    } else if (file.fieldname.startsWith("dokumentasi")) {
      cb(null, path.join(__dirname, "../../public/usulan-smart/dokumentasi/"));
    }
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions: AllowedExtensions = {
    regulasi: [
      ".png",
      ".jpg",
      ".jpeg",
      ".heic",
      ".pdf",
      ".docx",
      ".doc",
      ".pptx",
      "xlsx",
      "xls",
    ],
    dokumentasi: [
      ".png",
      ".jpg",
      ".jpeg",
      ".heic",
      ".pdf",
      ".docx",
      ".doc",
      ".pptx",
      "xlsx",
      "xls",
    ],
  };

  const extname = path.extname(file.originalname).toLowerCase();
  const fieldExtensions =
    allowedExtensions[file.fieldname.replace(/\[\d+\]$/, "")];

  if (fieldExtensions && fieldExtensions.includes(extname)) {
    cb(null, true);
  } else {
    cb(new Error(`Format tidak valid untuk ${file.fieldname}`));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, //10mb
  },
}).any();

const handleValidationFailure = async (
  files: Express.Multer.File[],
  errorMessage: string,
  res: Response
) => {
  await Promise.all(files.map((file) => fs.unlink(file.path)));
  return res.status(400).json({
    success: false,
    status: 400,
    message: {
      error: errorMessage,
    },
  });
};

const storageTwo = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname.startsWith("regulasi")) {
      cb(null, path.join(__dirname, "../../public/usulan-smart/berkas/"));
    } else if (file.fieldname.startsWith("dokumentasi")) {
      cb(null, path.join(__dirname, "../../public/usulan-smart/dokumentasi/"));
    }
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// File filter to validate file types (Versi 2)
const fileFilterTwo = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions: Record<string, string[]> = {
    regulasi: [
      ".png",
      ".jpg",
      ".jpeg",
      ".heic",
      ".pdf",
      ".docx",
      ".doc",
      ".pptx",
      "xlsx",
      "xls",
    ],
    dokumentasi: [
      ".png",
      ".jpg",
      ".jpeg",
      ".heic",
      ".pdf",
      ".docx",
      ".doc",
      ".pptx",
      "xlsx",
      "xls",
    ],
  };

  const extname = path.extname(file.originalname).toLowerCase();
  const fieldExtensions = allowedExtensions[file.fieldname];

  if (fieldExtensions && fieldExtensions.includes(extname)) {
    cb(null, true);
  } else {
    cb(new Error(`Format tidak valid untuk ${file.fieldname}`));
  }
};

// Setup multer with storage, file filter, and limits (Versi 2)
const uploadTwo = multer({
  storage: storageTwo,
  fileFilter: fileFilterTwo,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

const validateInput = (
  req: Request,
  files: Express.Multer.File[],
  res: Response
) => {
  const { nama_inovasi, tahun, user_id, kategori_id, deskripsi_inovasi } =
    req.body;

  if (
    !nama_inovasi ||
    !tahun ||
    !user_id ||
    !kategori_id ||
    !deskripsi_inovasi
  ) {
    return handleValidationFailure(files, "Harap isi semua field.", res);
  }

  const fields = [nama_inovasi, tahun, user_id, kategori_id, deskripsi_inovasi];
  if (!fields.every(Array.isArray)) {
    return handleValidationFailure(
      files,
      "nama_inovasi, tahun, user_id, dan kategori_id harus dalam bentuk array.",
      res
    );
  }

  if (fields.some((field) => field.length > 10)) {
    return handleValidationFailure(
      files,
      "Setiap kolom data tidak boleh memiliki lebih dari 10 item.",
      res
    );
  }

  if (fields.some((field) => field.some((value: string) => !value.trim()))) {
    return handleValidationFailure(files, "Harap isi semua field.", res);
  }

  for (let i = 0; i < nama_inovasi.length; i++) {
    const inovasiLinkDrive = req.body.link_drive[i];
    const regulasiFile = files.find((f) => f.fieldname === `regulasi[${i}]`);
    const dokumentasiFile = files.find(
      (f) => f.fieldname === `dokumentasi[${i}]`
    );

    if (!inovasiLinkDrive) {
      if (!regulasiFile) {
        return handleValidationFailure(
          files,
          `File regulasi atau link drive harus diisi untuk inovasi ke-${
            i + 1
          }.`,
          res
        );
      }
      if (!dokumentasiFile) {
        return handleValidationFailure(
          files,
          `File dokumentasi harus diisi untuk inovasi ke-${i + 1}.`,
          res
        );
      }
    }
  }

  return null;
};

interface CustomRequest extends Request {
  user?: JwtPayload | any;
}

const usulanSmartController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }

    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await UsulanSmart.findAndCountAll({
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["email"],
            include: [
              {
                model: Opd,
                as: "opd",
                attributes: ["nama_opd"],
              },
            ],
          },
          {
            model: Kategori,
            as: "kategori",
            attributes: ["jenis_smart"],
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      if (rows.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Usulan Smart Tidak Ditemukan",
          },
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
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      return res.status(500).json({
        success: false,
        status: 500,
        message: error,
      });
    }
  },

  grafikLineTrendInovasiPertahun: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Menghitung jumlah data berdasarkan kolom "tahun"
      const yearlyData = await UsulanSmart.findAll({
        attributes: [
          "tahun", // langsung gunakan kolom 'tahun'
          [sequelize.fn("COUNT", sequelize.col("id")), "total"], // hitung jumlah data per tahun
        ],
        group: ["tahun"],
        order: [["tahun", "ASC"]],
      });

      // Format data untuk keperluan chart
      const labels = yearlyData.map((item: any) => item.get("tahun"));
      const data = yearlyData.map((item: any) => item.get("total"));

      const response = {
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: { labels, data },
      };

      return res.status(200).json(response);
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      return res.status(500).json({
        success: false,
        status: 500,
        message: error,
      });
    }
  },

  grafikDistribusiKategori: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Menghitung jumlah data berdasarkan kategori dan tahun
      const categoryData = await UsulanSmart.findAll({
        attributes: [
          "tahun",
          [sequelize.col("kategori.jenis_smart"), "jenis_smart"], // Nama kategori dari tabel kategori sebagai 'jenis_smart'
          [sequelize.fn("COUNT", sequelize.col("UsulanSmarts.id")), "total"], // Hitung jumlah data per kategori dan tahun
        ],
        include: [
          {
            model: Kategori, // Model tabel kategori
            as: "kategori", // Alias sesuai asosiasi
            attributes: [], // Tidak menambahkan atribut lain ke hasil query
          },
        ],
        group: ["tahun", "kategori.jenis_smart"],
        order: [
          ["tahun", "ASC"],
          ["jenis_smart", "ASC"],
        ],
      });

      // Ambil semua tahun dan jenis_smart unik
      const labels = [
        ...new Set(categoryData.map((item: any) => item.get("tahun"))),
      ];
      const categories = [
        ...new Set(categoryData.map((item: any) => item.get("jenis_smart"))),
      ];

      // Format data untuk chart
      const data = categories.map((category) => ({
        name: category,
        data: labels.map((year) => {
          const record: any = categoryData.find(
            (item: any) =>
              item.get("jenis_smart") === category && item.get("tahun") === year
          );
          return record ? parseInt(record.get("total"), 10) : 0;
        }),
      }));

      // Format respons sesuai permintaan
      const response = {
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: { labels, data },
      };

      return res.status(200).json(response);
    } catch (error: any) {
      // Log error jika terjadi kesalahan
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      return res.status(500).json({
        success: false,
        status: 500,
        message: error.message,
      });
    }
  },

  grafikDistribusiProgres: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Mengambil data progres berdasarkan kategori dan dinas
      const progresData = await Progres.findAll({
        attributes: [
          [sequelize.col("usulanSmarts.kategori.jenis_smart"), "jenis_smart"], // Nama kategori inovasi
          [sequelize.col("usulanSmarts.user.opd.nama_opd"), "nama_opd"], // Nama dinas
          [
            sequelize.fn("COUNT", sequelize.col("Progres.id")),
            "jumlah_progres",
          ], // Hitung jumlah progres per dinas dan kategori
        ],
        include: [
          {
            model: UsulanSmart, // Menghubungkan ke tabel UsulanSmart
            as: "usulanSmarts",
            attributes: [], // Tidak menambahkan atribut tambahan
            include: [
              {
                model: Kategori, // Menghubungkan ke tabel Kategori
                as: "kategori",
                attributes: [], // Tidak menambahkan atribut tambahan
              },
              {
                model: User, // Menghubungkan ke tabel User
                as: "user",
                attributes: [], // Tidak menambahkan atribut tambahan
                include: [
                  {
                    model: Opd, // Menghubungkan ke tabel Opds
                    as: "opd",
                    attributes: [], // Tidak menambahkan atribut tambahan
                  },
                ],
              },
            ],
          },
        ],
        group: [
          "usulanSmarts.kategori.jenis_smart",
          "usulanSmarts.user.opd.nama_opd",
        ], // Kelompokkan berdasarkan kategori inovasi dan dinas
        order: [
          ["jenis_smart", "ASC"],
          ["nama_opd", "ASC"],
        ],
      });

      // Mendapatkan daftar kategori inovasi dan nama dinas yang unik
      const categories = [
        ...new Set(progresData.map((item: any) => item.get("jenis_smart"))),
      ];
      const dinasList = [
        ...new Set(progresData.map((item: any) => item.get("nama_opd"))),
      ];

      // Mengonversi data untuk format chart
      const data = categories.map((category) => ({
        name: category,
        data: dinasList.map((dinas) => {
          const record: any = progresData.find(
            (item: any) =>
              item.get("jenis_smart") === category &&
              item.get("nama_opd") === dinas
          );
          return record ? parseFloat(record.get("rata_progres")) : 0; // Rata-rata progres jika ada, atau 0 jika tidak ada
        }),
      }));

      // Menyusun respons sesuai format
      const response = {
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: { labels: dinasList, data },
      };

      return res.status(200).json(response);
    } catch (error: any) {
      // Logging jika terjadi error
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      return res.status(500).json({
        success: false,
        status: 500,
        message: error.message,
      });
    }
  },

  tambahUsulan: async (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Batas Upload Dokumentasi Maupun Regulasi 10MB !",
            },
          });
        } else {
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: err.message,
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

      try {
        const files = req.files as Express.Multer.File[];
        const validationError = validateInput(req, files, res);
        if (validationError) return validationError;

        const {
          nama_inovasi,
          tahun,
          user_id,
          kategori_id,
          deskripsi_inovasi,
          link_drive,
        } = req.body;

        const dataToInsert = nama_inovasi.map((_: string, i: number) => ({
          nama_inovasi: nama_inovasi[i],
          deskripsi_inovasi: deskripsi_inovasi[i],
          regulasi:
            files.find((f) => f.fieldname === `regulasi[${i}]`)?.filename ||
            null,
          dokumentasi:
            files.find((f) => f.fieldname === `dokumentasi[${i}]`)?.filename ||
            null,
          tahun: tahun[i],
          link_drive: link_drive[i],
          user_id: user_id[i],
          kategori_id: kategori_id[i],
        }));

        const newUsulanSmart = await UsulanSmart.bulkCreate(dataToInsert, {
          transaction,
        });
        const trackingEntries = newUsulanSmart.map((usulan: any, i) => ({
          user_id: usulan.user_id,
          usulan_id: usulan.id,
          keterangan: `Menambahkan Data Inovasi ${nama_inovasi[i]}`,
        }));
        await Tracking.bulkCreate(trackingEntries, { transaction });
        // Ambil data kategori terlebih dahulu berdasarkan kategori_id yang ada di newUsulanSmart
        const kategoriIds = newUsulanSmart.map(
          (usulan: any) => usulan.kategori_id
        );
        const kategoris = await Kategori.findAll({
          where: {
            id: kategoriIds,
          },
          raw: true, // Mengambil hasil dalam bentuk plain object
        });

        // Buat dictionary untuk memetakan kategori_id ke kategori_nama
        const kategoriMap = kategoris.reduce((map: any, kategori: any) => {
          map[kategori.id] = kategori.jenis_smart; // Misal nama kolom untuk nama kategori adalah 'nama'
          return map;
        }, {});

        const notifikasiEntries = newUsulanSmart.map((usulan: any) => ({
          user_id: usulan.user_id,
          usulan_id: usulan.id,
          title: `${usulan.nama_inovasi}`,
          message: `Menambahkan Data Inovasi ${
            usulan.nama_inovasi
          } ke dalam Dimensi ${kategoriMap[usulan.kategori_id]}`,
        }));
        await Notifikasi.bulkCreate(notifikasiEntries, { transaction });

        await transaction.commit();

        io.emit("usulanAdded", newUsulanSmart);

        res.status(201).json({
          success: true,
          status: 201,
          message: "Data berhasil disimpan",
          result: newUsulanSmart,
        });
      } catch (error: any) {
        await LogError.create({
          jenis_akses: "backend",
          error_message: error.message,
          stack_trace: error.stack,
        });
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          status: 500,
          message: error,
        });
      }
    });
  },

  editUsulan: async (req: Request, res: Response, next: NextFunction) => {
    uploadTwo.fields([
      { name: "dokumentasi", maxCount: 1 },
      { name: "regulasi", maxCount: 1 },
    ])(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Batas Upload Dokumentasi Maupun Regulasi 10MB!",
            },
          });
        } else {
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: err.message,
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
      const usulanId = req.params.id;

      try {
        const {
          nama_inovasi,
          deskripsi_inovasi,
          tahun,
          user_id,
          kategori_id,
          link_drive,
        } = req.body;

        const existingUsulan: any = await UsulanSmart.findByPk(usulanId);

        if (!existingUsulan) {
          return res.status(404).json({
            success: false,
            status: 404,
            message: {
              error: "Usulan tidak ditemukan",
            },
          });
        }

        // Handle file uploads
        const files = req.files as {
          dokumentasi?: Express.Multer.File[];
          regulasi?: Express.Multer.File[];
        };

        // Extract new file names if provided
        const newDokumentasi = files.dokumentasi
          ? files.dokumentasi[0].filename
          : null;
        const newRegulasi = files.regulasi ? files.regulasi[0].filename : null;

        // Determine if we need to delete old files
        const oldDokumentasi = existingUsulan.dokumentasi;
        const oldRegulasi = existingUsulan.regulasi;

        // Set new values for document fields
        const dokumentasi = newDokumentasi || oldDokumentasi;
        const regulasi = newRegulasi || oldRegulasi;

        // Delete old files if they are being replaced
        if (newDokumentasi && oldDokumentasi) {
          fs.unlink(
            path.join(
              __dirname,
              `../../public/usulan-smart/dokumentasi/${oldDokumentasi}`
            )
          );
        }
        if (newRegulasi && oldRegulasi) {
          fs.unlink(
            path.join(
              __dirname,
              `../../public/usulan-smart/berkas/${oldRegulasi}`
            )
          );
        }

        // Update the record with new data
        await existingUsulan.update(
          {
            nama_inovasi,
            deskripsi_inovasi,
            tahun,
            user_id,
            kategori_id,
            link_drive,
            dokumentasi,
            regulasi,
          },
          { transaction }
        );

        // Log tracking data
        await Tracking.create(
          {
            user_id: existingUsulan.user_id,
            usulan_id: existingUsulan.id,
            keterangan: "Mengupdate Data Inovasi " + nama_inovasi,
          },
          { transaction }
        );

        await transaction.commit();
        io.emit("usulanUpdated", existingUsulan);

        res.status(201).json({
          success: true,
          status: 201,
          message: "Data berhasil diupdate",
          result: existingUsulan,
        });
      } catch (error: any) {
        await LogError.create({
          jenis_akses: "backend",
          error_message: error.message,
          stack_trace: error.stack,
        });
        await transaction.rollback();
        return res.status(500).json({
          success: false,
          status: 500,
          message: error,
        });
      }
    });
  },

  getAllByKategoriId: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;
    const { kategori_id } = req.params;

    try {
      // Step 1: Fetch all data without pagination for counting purposes
      const allRows = await UsulanSmart.findAll({
        where: {
          kategori_id: kategori_id,
        },
        attributes: ["nama_inovasi", "user_id"],
        include: [
          {
            model: Kategori,
            as: "kategori",
            attributes: ["id", "jenis_smart"],
          },
          {
            model: User,
            as: "user",
            attributes: ["id"],
            include: [
              {
                model: Opd,
                as: "opd",
                attributes: ["nama_opd"],
              },
            ],
          },
        ],
      });

      const opdMap: any = {};

      // Use allRows to count `jumlah_data`
      allRows.forEach((usulan: any) => {
        const opdName = usulan.user.opd.nama_opd;
        const user_id = usulan.user_id;
        const jenisSmart = usulan.kategori.jenis_smart;
        const jenisSmartId = usulan.kategori.id;
        if (!opdMap[opdName]) {
          opdMap[opdName] = {
            opd: { nama_opd: opdName },
            kategori: { id: jenisSmartId, jenis_smart: jenisSmart },
            user_id,
            jumlah_data: 0,
          };
        }
        opdMap[opdName].jumlah_data += 1;
      });

      const dataFix = Object.keys(opdMap).map((opdName) => {
        const { opd, jumlah_data, kategori, user_id } = opdMap[opdName];
        return {
          opd,
          kategori,
          jumlah_data,
          user_id,
        };
      });

      // Step 2: Paginate the fixed data
      const paginatedDataFix = dataFix.slice(offset, offset + limit);
      const totalPages = Math.ceil(dataFix.length / limit);
      const totalData = dataFix.length; // Menggunakan jumlah data dari dataFix

      if (paginatedDataFix.length === 0) {
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
        result: paginatedDataFix,
        page: page,
        total_pages: totalPages,
        total_data: totalData, // Menggunakan jumlah data dari dataFix
      };

      return res.status(200).json(response);
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      return res.status(500).json({
        success: false,
        status: 500,
        message: error,
      });
    }
  },

  searchAllByAdminKategoriId: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const searchTerm = req.query.search;
    const { kategori_id } = req.params;

    try {
      const getSearch = await UsulanSmart.findAll({
        where: {
          kategori_id: kategori_id,
        },
        attributes: ["nama_inovasi"],
        include: [
          {
            model: Kategori,
            as: "kategori",
            attributes: ["jenis_smart"],
          },
          {
            model: User,
            as: "user",
            attributes: ["id"],
            include: [
              {
                model: Opd,
                as: "opd",
                attributes: ["nama_opd"],
                where: {
                  nama_opd: {
                    [Op.like]: `%${searchTerm}%`,
                  },
                },
                required: true,
              },
            ],
          },
        ],
      });

      if (getSearch.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Kategori Tidak Ditemukan",
          },
        });
      }

      const opdMap: any = {};
      getSearch.forEach((usulan: any) => {
        if (usulan.user && usulan.user.opd) {
          const opdName = usulan.user.opd.nama_opd;
          const jenisSmart = usulan.kategori.jenis_smart;
          if (!opdMap[opdName]) {
            opdMap[opdName] = {
              opd: { nama_opd: opdName },
              jumlah_data: 0,
              kategori: jenisSmart,
              usulan_smart: [],
            };
          }
          opdMap[opdName].jumlah_data += 1;
        }
      });

      const dataFix = Object.keys(opdMap).map((opdName: any) => {
        const { opd, jumlah_data, kategori } = opdMap[opdName];
        return {
          opd,
          jumlah_data,
          kategori,
        };
      });

      if (dataFix.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Usulan Tidak Ditemukan Pada Database",
          },
        });
      }
      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: dataFix,
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
          error: error.message,
        },
      });
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const getUsulanById: any = await UsulanSmart.findOne({
        where: { id },
        include: [
          {
            model: Kategori,
            as: "kategori",
            attributes: ["jenis_smart", "deskripsi", "foto_smart"],
          },
          {
            model: User,
            as: "user",
            attributes: ["opd_id"],
            include: [
              {
                model: Opd,
                as: "opd",
                attributes: ["nama_opd"],
              },
            ],
          },
        ],
      });

      if (!getUsulanById) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: { error: "Data Opd Tidak Ditemukan" },
        });
      }

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: {
          usulan: getUsulanById,
        },
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
        message: { error: error },
      });
    }
  },

  getUsulanWithProgres: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id, user_id } = req.params;

    try {
      // Fetch the UsulanSmart data by ID
      const getUsulanById: any = await UsulanSmart.findOne({
        where: { id },
        include: [
          {
            model: Kategori,
            as: "kategori",
            attributes: ["jenis_smart", "deskripsi", "foto_smart"],
          },
          {
            model: User,
            as: "user",
            attributes: ["opd_id"],
            include: [
              {
                model: Opd,
                as: "opd",
                attributes: ["nama_opd"],
              },
            ],
          },
        ],
      });

      if (!getUsulanById) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: { error: "Data Opd Tidak Ditemukan" },
        });
      }

      // Fetch the Progres data related to the UsulanSmart
      const responseData: any = await Progres.findAll({
        where: {
          user_id: user_id,
          usulan_id: id,
        },
        include: [
          {
            model: UsulanSmart,
            as: "usulanSmarts",
          },
        ],
      });

      // If no progress data is found
      if (responseData.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data progres tidak ditemukan",
          },
        });
      }

      // Process each progres item to include the base64 image
      const processedProgresRows = await Promise.all(
        responseData.map(async (progressItem: any) => {
          const item = progressItem.toJSON(); // Convert to plain object
          const filePath = path.join(
            __dirname,
            "../../public/foto-dokumentasi",
            item.foto_kegiatan
          );

          let base64Image = "";
          let mimeType = "application/octet-stream";

          if (fsLink.existsSync(filePath)) {
            mimeType = mime.lookup(filePath) || mimeType;
            const imageBuffer = fsLink.readFileSync(filePath);
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

      // Prepare the supporting documents (bukti dukung)
      const buktiDukung = processedProgresRows.map((progress) => {
        return {
          id: progress.id,
          foto_kegiatan: progress.foto_kegiatan,
          tipe_file: progress.tipe_file,
          // Add other properties if needed
        };
      });

      // Prepare the final response
      const response = {
        success: true,
        status: 200,
        message: "Data ditemukan",
        result: {
          usulan: getUsulanById,
          bukti_dukung: buktiDukung,
          progres_usulan: processedProgresRows,
        },
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
        message: { error: error },
      });
    }
  },

  getByIdOptimisasi: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id, user_id } = req.params;

    try {
      const getUsulanById: any = await UsulanSmart.findOne({
        where: { id },
        include: [
          {
            model: Kategori,
            as: "kategori",
            attributes: ["jenis_smart", "deskripsi", "foto_smart"],
          },
          {
            model: User,
            as: "user",
            attributes: ["opd_id"],
            include: [
              {
                model: Opd,
                as: "opd",
                attributes: ["nama_opd"],
              },
            ],
          },
        ],
      });

      if (!getUsulanById) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: { error: "Data Opd Tidak Ditemukan" },
        });
      }
      const [responseData, getOpdById] = await Promise.all([
        Progres.findAll({
          where: {
            user_id: user_id,
            usulan_id: id,
          },
          order: [["tanggal", "ASC"]],
        }),
        Tracking.findAll({
          where: {
            usulan_id: id,
            user_id: user_id,
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: {
          usulan: {
            id: getUsulanById.id,
            nama_inovasi: getUsulanById.nama_inovasi,
            deskripsi_inovasi: getUsulanById.deskripsi_inovasi ?? null,
            link_drive: getUsulanById.link_drive ?? null,
            user_id: getUsulanById.user_id,
            kategori_id: getUsulanById.kategori_id,
            tahun: getUsulanById.tahun,
            deletedAt: getUsulanById.deletedAt,
            createdAt: getUsulanById.createdAt,
            updatedAt: getUsulanById.updatedAt,
            kategori: getUsulanById.kategori ?? null,
            user: getUsulanById.user ?? null,
          },
          bukti_pendukung: {
            dokumentasi: getUsulanById.dokumentasi ?? null,
            regulasi: getUsulanById.regulasi ?? null,
          },
          progres: responseData.length > 0 ? responseData : null,
          tracking: getOpdById.length > 0 ? getOpdById : null,
        },
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
        message: error,
      });
    }
  },

  // showBuktiDukungRegulasiByDetailId: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   const { nama_file } = req.params;

  //   try {
  //     const [getFileRegulasi]: any = await sequelize.query(
  //       `
  //       SELECT * FROM usulansmarts
  //      WHERE (JSON_SEARCH(regulasi, 'one', :nama_file) IS NOT NULL
  //      OR regulasi LIKE :nama_file_like)
  //       `,
  //       {
  //         type: QueryTypes.SELECT,
  //         replacements: { nama_file, nama_file_like: `%${nama_file}%` },
  //       }
  //     );

  //     console.log(nama_file);

  //     if (!getFileRegulasi) {
  //       return res.status(404).json({
  //         success: false,
  //         status: 404,
  //         message: "File regulasi tidak ditemukan di database",
  //       });
  //     }

  //     const regulasiPath = path.join(
  //       __dirname,
  //       "../../public/usulan-smart/berkas",
  //       nama_file // use nama_file directly
  //     );

  //     if (!fsLink.existsSync(regulasiPath)) {
  //       return res.status(404).json({
  //         success: false,
  //         status: 404,
  //         message: "File regulasi tidak ditemukan di path",
  //       });
  //     }

  //     res.sendFile(regulasiPath);
  //   } catch (error: any) {
  //     console.error(error);
  //     res.status(500).json({
  //       success: false,
  //       status: 500,
  //       message: error.stack,
  //     });
  //   }
  // },

  showBuktiDukungRegulasiByDetailId: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { nama_file } = req.params;

    try {
      const [getFileRegulasi]: any = await sequelize.query(
        `
        SELECT * FROM usulansmarts 
       WHERE (JSON_SEARCH(regulasi, 'one', :nama_file) IS NOT NULL 
       OR regulasi LIKE :nama_file_like)
        `,
        {
          type: QueryTypes.SELECT,
          replacements: { nama_file, nama_file_like: `%${nama_file}%` },
        }
      );

      console.log(nama_file);

      if (!getFileRegulasi) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "File regulasi tidak ditemukan di database",
        });
      }

      const regulasiPath = path.join(
        __dirname,
        "../../public/usulan-smart/berkas",
        nama_file // use nama_file directly
      );

      if (!fsLink.existsSync(regulasiPath)) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "File regulasi tidak ditemukan di path",
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

  showBuktiDukungDokumentasiByDetailId: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { nama_file } = req.params;

    try {
      const [getFilDokumentasi] = await sequelize.query(
        `SELECT * FROM usulansmarts 
       WHERE (JSON_SEARCH(dokumentasi, 'one', :nama_file) IS NOT NULL 
       OR dokumentasi LIKE :nama_file_like)`,
        {
          type: QueryTypes.SELECT,
          replacements: {
            nama_file,
            nama_file_like: `%${nama_file}%`, // untuk pencarian pada string biasa
          },
        }
      );

      if (!getFilDokumentasi) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "File Dokumentasi tidak ditemukan di database",
        });
      }

      const DokumentasiPath = path.join(
        __dirname,
        "../../public/usulan-smart/dokumentasi",
        nama_file
      );

      if (!fsLink.existsSync(DokumentasiPath)) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "File regulasi tidak ditemukan di path",
        });
      }

      res.sendFile(DokumentasiPath);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        success: false,
        status: 500,
        message: error.stack,
      });
    }
  },

  search: async (req: Request, res: Response, next: NextFunction) => {
    const { user_id, kategori_id } = req.params;
    const searchTerm = req.query.search;

    try {
      const getSearch = await UsulanSmart.findAll({
        where: {
          user_id: user_id,
          kategori_id: kategori_id,
          nama_inovasi: {
            [Op.like]: `%${searchTerm}%`,
          },
        },
        include: [
          {
            model: Kategori,
            as: "kategori",
            attributes: ["jenis_smart"],
          },
        ],
      });

      if (getSearch.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Usulan Tidak Ditemukan",
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

  deleteUsulanSmart: async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    const transaction = await sequelize.transaction();
    const { nama_inovasi, alasan_penghapusan, password, keywords } = req.body;
    const idPengguna = req.user.userId;
    const namaPengguna = req.user.nama_lengkap;

    try {
      const { id } = req.params;

      interface UsulanSmart {
        regulasi: string;
        dokumentasi: string;
        destroy: () => Promise<void>;
        nama_inovasi: string;
        user_id: number;
      }

      // Validasi input
      if (!nama_inovasi || !keywords || !alasan_penghapusan || !password) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error:
              "Nama Inovasi, keywords, alasan penghapusan, password tidak boleh kosong",
          },
        });
      }

      // Validasi panjang minimal alasan_penghapusan
      if (alasan_penghapusan.length < 10) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error:
              "Alasan Penghapusan harus memiliki panjang minimal 10 karakter",
          },
        });
      }

      // Cari data di tabel Progres yang terkait dengan usulan_id
      const usulanSmartByProgress: any = await Progres.findAll({
        where: { usulan_id: id },
        transaction,
      });

      if (usulanSmartByProgress.length > 0) {
        // Hapus semua data di tabel Progres yang terkait dengan usulan_id jika ada
        for (const progress of usulanSmartByProgress) {
          await Progres.destroy({ where: { id: progress.id } });
          await progress.destroy();
        }
      }

      // Cari data UsulanSmart
      const usulanSmart: any | null = (await UsulanSmart.findByPk(
        id
      )) as UsulanSmart | null;

      if (!usulanSmart) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "UsulanSmart tidak ditemukan",
          },
        });
      }

      // Cari data User
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

      // Validasi nama_inovasi
      if (nama_inovasi !== usulanSmart.nama_inovasi) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Nama Inovasi Tidak Sesuai Dengan Inovasi Yang Dipilih",
          },
        });
      }

      // Validasi keywords
      if (keywords !== "delete/my-inovasi") {
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

      // Hapus data UsulanSmart
      await usulanSmart.destroy();

      // Log tracking
      await Tracking.create({
        user_id: usulanSmart.user_id,
        usulan_id: usulanSmart.id,
        keterangan: `Menghapus Data Inovasi ` + usulanSmart.nama_inovasi,
      });

      // Simpan riwayat penghapusan
      await HistoryPenghapusan.create({
        id_user: idPengguna,
        id_usulan: usulanSmart.id,
        nama_data: usulanSmart.nama_inovasi,
        tipe_data: "Entry Data",
        status: "Hapus Sementara",
        nama_tabel: "Tabel Usulan Smart",
        nama_pengguna: namaPengguna,
        alasan_penghapusan: alasan_penghapusan.toLowerCase(),
      });

      await transaction.commit();
      return res.status(200).json({
        success: true,
        status: 200,
        message: "UsulanSmart berhasil dihapus",
      });
    } catch (error: any) {
      console.error("Error details: ", error);
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },

  deleteUsulanSmartPermanen: async (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => {
    const transaction = await sequelize.transaction();
    const { nama_inovasi, alasan_penghapusan, password, keywords } = req.body;
    const idPengguna = req.user.userId;
    const namaPengguna = req.user.nama_lengkap;
    try {
      const { id } = req.params;

      interface UsulanSmart {
        regulasi: string;
        dokumentasi: string;
        destroy: () => Promise<void>;
      }

      if (!nama_inovasi || !keywords || !alasan_penghapusan || !password) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error:
              "Nama Inovasi, keywords, alasan penghapusan, password tidak boleh kosong",
          },
        });
      }

      // Validasi panjang minimal alasan_penghapusan
      if (alasan_penghapusan.length < 10) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error:
              "Alasan Penghapusan harus memiliki panjang minimal 10 karakter",
          },
        });
      }

      const usulanSmartByProgress: any = await Progres.findAll({
        where: { usulan_id: id },
        transaction,
        paranoid: false,
      });

      if (usulanSmartByProgress.length > 0) {
        for (const user of usulanSmartByProgress) {
          await Progres.findByPk(user.id);
          await user.restore();
        }

        for (const user of usulanSmartByProgress) {
          await Progres.destroy({ where: { id: user.id } });
          const regulasiPath = path.join(
            __dirname,
            "../../public/foto-dokumentasi/",
            user.foto_kegiatan
          );
          if (fsLink.existsSync(regulasiPath)) {
            fsLink.unlinkSync(regulasiPath);
          }
          await user.destroy({
            force: true,
          });
        }
      }

      const usulanSmart: UsulanSmart | any = (await UsulanSmart.findByPk(id, {
        paranoid: false,
      })) as UsulanSmart | null;

      if (!usulanSmart) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "UsulanSmart tidak ditemukan",
          },
        });
      }

      if (usulanSmart.regulasi) {
        const regulasiPath = path.join(
          __dirname,
          "../../public/usulan-smart/berkas",
          usulanSmart.regulasi
        );
        if (fsLink.existsSync(regulasiPath)) {
          fsLink.unlinkSync(regulasiPath);
        }
      }

      if (usulanSmart.dokumentasi) {
        const dokumentasiPath = path.join(
          __dirname,
          "../../public/usulan-smart/dokumentasi",
          usulanSmart.dokumentasi
        );
        if (fsLink.existsSync(dokumentasiPath)) {
          fsLink.unlinkSync(dokumentasiPath);
        }
      }

      // Cari data User
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

      // Validasi nama_inovasi
      if (nama_inovasi !== usulanSmart.nama_inovasi) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Nama Inovasi Tidak Sesuai Dengan Inovasi Yang Dipilih",
          },
        });
      }

      // Validasi keywords
      if (keywords !== "delete-permanen/my-inovasi") {
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

      await usulanSmart.destroy({
        force: true,
      });

      // Log tracking
      await Tracking.create({
        user_id: usulanSmart.user_id,
        usulan_id: usulanSmart.id,
        keterangan:
          `Menghapus Secara Permanen Data Inovasi ` + usulanSmart.nama_inovasi,
      });

      // Simpan riwayat penghapusan
      await HistoryPenghapusan.create({
        id_user: idPengguna,
        id_usulan: usulanSmart.id,
        nama_data: usulanSmart.nama_inovasi,
        tipe_data: "Entry Data",
        status: "Hapus Permanen",
        nama_tabel: "Tabel Usulan Smart",
        nama_pengguna: namaPengguna,
        alasan_penghapusan: alasan_penghapusan.toLowerCase(),
      });

      await transaction.commit();
      return res.status(200).json({
        success: true,
        status: 200,
        message: "UsulanSmart berhasil dihapus",
        result: usulanSmart,
      });
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },

  restoreUsulanSmartPermanen: async (
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

      interface UsulanSmart {
        regulasi: string;
        dokumentasi: string;
        destroy: () => Promise<void>;
      }

      if (!keywords || !alasan_penghapusan || !password) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error:
              "Nama Inovasi, keywords, alasan penghapusan, password tidak boleh kosong",
          },
        });
      }

      // Validasi panjang minimal alasan_penghapusan
      if (alasan_penghapusan.length < 10) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error:
              "Alasan Penghapusan harus memiliki panjang minimal 10 karakter",
          },
        });
      }

      const usulanSmartByProgress: any = await Progres.findAll({
        where: { usulan_id: id },
        transaction,
        paranoid: false,
      });

      if (usulanSmartByProgress.length > 0) {
        for (const user of usulanSmartByProgress) {
          await Progres.findByPk(user.id);
          await user.restore();
        }
      }

      const usulanSmart: UsulanSmart | any = (await UsulanSmart.findByPk(id, {
        paranoid: false,
      })) as UsulanSmart | null;

      if (!usulanSmart) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Usulan Smart Tidak Ditemukan",
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
      if (keywords !== "restore/my-inovasi") {
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

      await usulanSmart.restore();

      await Tracking.create({
        user_id: usulanSmart.user_id,
        usulan_id: usulanSmart.id,
        keterangan: `Memulihkan Data Inovasi` + usulanSmart.nama_inovasi,
      });

      const existingHistory = await HistoryPenghapusan.findOne({
        where: {
          id_user: usulanSmart.user_id,
          id_usulan: usulanSmart.id,
        },
      });

      if (existingHistory) {
        // Update status jika entri sudah ada
        await existingHistory.update({
          status: "Dipulihkan",
          alasan_penghapusan: alasan_penghapusan.toLowerCase(),
        });
      }

      await transaction.commit();
      return res.status(200).json({
        success: true,
        status: 200,
        message: "UsulanSmart berhasil Dipulihkan",
        result: usulanSmart,
      });
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      await transaction.rollback();
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },

  getAllByUserIdAndByKategoriId: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;
    const { user_id, kategori_id } = req.params;

    try {
      const { count, rows }: any = await UsulanSmart.findAndCountAll({
        limit,
        offset,
        where: {
          user_id: user_id,
          kategori_id: kategori_id,
        },
        order: [["createdAt", "DESC"]],
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
        include: [
          {
            model: Kategori,
            as: "kategori",
            attributes: ["jenis_smart"],
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
      return res.status(500).json({
        success: false,
        status: 500,
        message: error,
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
      const { count, rows }: any = await UsulanSmart.findAndCountAll({
        limit,
        offset,
        where: {
          user_id: user_id,
        },
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
        include: [
          {
            model: Kategori,
            as: "kategori",
            attributes: ["jenis_smart"],
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
      return res.status(500).json({
        success: false,
        status: 500,
        message: error,
      });
    }
  },

  searchAllByUserAdmin: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { user_id } = req.params;
    const searchTerm = req.query.search;

    try {
      const getSearch = await UsulanSmart.findAll({
        where: {
          user_id: user_id,
          nama_inovasi: {
            [Op.like]: `%${searchTerm}%`,
          },
        },
        attributes: {
          exclude: ["createdAt", "updatedAt"],
        },
        include: [
          {
            model: Kategori,
            as: "kategori",
            attributes: ["jenis_smart"],
          },
        ],
      });

      if (getSearch.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Tidak Ditemukan",
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

  showDokumentasi: async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
      const usulanDokumentasi: any = await UsulanSmart.findByPk(id);

      if (!usulanDokumentasi) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Foto Dokumentasi tidak ditemukan",
        });
      }

      console.log(usulanDokumentasi.dokumentasi);

      let fotoName;
      if (Array.isArray(usulanDokumentasi.dokumentasi)) {
        fotoName = usulanDokumentasi.dokumentasi[0];
      } else {
        fotoName = usulanDokumentasi.dokumentasi;
      }

      if (!fotoName) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Foto Dokumentasi tidak tersedia",
        });
      }

      const dokumentasiPath = path.join(
        __dirname,
        "../../public/usulan-smart/dokumentasi",
        fotoName
      );

      if (!fsLink.existsSync(dokumentasiPath)) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Dokumentasi tidak ditemukan di path",
        });
      }

      res.sendFile(dokumentasiPath);
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      res.status(500).json({
        success: false,
        status: 500,
        message: "Terjadi kesalahan dalam memproses permintaan",
      });
    }
  },

  searchAllByAdmin: async (req: Request, res: Response, next: NextFunction) => {
    const searchTerm = req.query.search;

    try {
      const getSearch = await UsulanSmart.findAll({
        include: [
          {
            model: Kategori,
            as: "kategori",
            attributes: ["jenis_smart"],
          },
          {
            model: User,
            as: "user",
            include: [
              {
                model: Opd,
                as: "opd",
                attributes: ["nama_opd"],
              },
            ],
            attributes: [], // Exclude user attributes except needed for joins
          },
        ],
        where: {
          [Op.or]: [
            {
              nama_inovasi: {
                [Op.like]: `%${searchTerm}%`,
              },
            },
            {
              "$kategori.jenis_smart$": {
                [Op.like]: `%${searchTerm}%`,
              },
            },
            {
              "$user.opd.nama_opd$": {
                [Op.like]: `%${searchTerm}%`,
              },
            },
          ],
        },
      });
      if (getSearch.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Tidak Ditemukan",
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

  downloadDokumentasi: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { id } = req.params;

    try {
      const usulanDokumentasi: any = await UsulanSmart.findByPk(id);

      if (!usulanDokumentasi) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Foto Dokumentasi tidak ditemukan",
        });
      }

      const fotoName = usulanDokumentasi.dokumentasi;

      if (!fotoName) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Foto Dokumentasi tidak tersedia",
        });
      }
      // Mendapatkan path lengkap ke file foto
      const dokumentasiPath = path.join(
        __dirname,
        "../../public/usulan-smart/dokumentasi",
        fotoName
      );

      if (!fsLink.existsSync(dokumentasiPath)) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "File Dokumentasi tidak ditemukan",
          },
        });
      }

      const mimeType = mime.lookup(dokumentasiPath);

      // Check if the file is a PDF or an image
      const isPdf = mimeType === "application/pdf";
      const isImage = mimeType && mimeType.startsWith("image/");

      // If the file is a PDF or image, display it in the browser; otherwise, force download
      if (isPdf || isImage) {
        res.sendFile(dokumentasiPath, {
          headers: { "Content-Type": mimeType },
        });
      } else {
        res.download(dokumentasiPath, fotoName);
      }
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      res.status(500).json({
        success: false,
        status: 500,
        message: "Terjadi kesalahan dalam memproses permintaan",
      });
    }
  },

  showRegulasi: async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
      const usulanRegulasi: any = await UsulanSmart.findByPk(id);

      if (!usulanRegulasi) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "UsulanSmart tidak ditemukan",
        });
      }

      const regulasiName = usulanRegulasi.regulasi;
      if (!regulasiName) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "File regulasi tidak tersedia",
          },
        });
      }

      const regulasiPath = path.join(
        __dirname,
        "../../public/usulan-smart/berkas",
        regulasiName
      );

      if (!fsLink.existsSync(regulasiPath)) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "File regulasi tidak ditemukan",
          },
        });
      }

      res.sendFile(regulasiPath);
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      res.status(500).json({
        success: false,
        status: 500,
        message: "Terjadi kesalahan dalam memproses permintaan",
      });
    }
  },

  downloadRegulasi: async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    try {
      const usulanRegulasi: any = await UsulanSmart.findByPk(id);

      if (!usulanRegulasi) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "UsulanSmart tidak ditemukan",
        });
      }

      const regulasiName = usulanRegulasi.regulasi;
      if (!regulasiName) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "File regulasi tidak tersedia",
          },
        });
      }

      const regulasiPath = path.join(
        __dirname,
        "../../public/usulan-smart/berkas",
        regulasiName
      );

      if (!fsLink.existsSync(regulasiPath)) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "File regulasi tidak ditemukan",
          },
        });
      }

      // Determine the file's MIME type
      const mimeType = mime.lookup(regulasiPath);

      // Check if the file is a PDF or an image
      const isPdf = mimeType === "application/pdf";
      const isImage = mimeType && mimeType.startsWith("image/");

      // If the file is a PDF or image, display it in the browser; otherwise, force download
      if (isPdf || isImage) {
        res.sendFile(regulasiPath, { headers: { "Content-Type": mimeType } });
      } else {
        res.download(regulasiPath, regulasiName);
      }
    } catch (error: any) {
      await LogError.create({
        jenis_akses: "backend",
        error_message: error.message,
        stack_trace: error.stack,
      });
      res.status(500).json({
        success: false,
        status: 500,
        message: "Terjadi kesalahan dalam memproses permintaan",
      });
    }
  },

  exportDownloadPdf: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { jenis_report, itemPerhalaman } = req.body;

      if (jenis_report === "semua") {
        const maxItemsPerPage = 13;

        function getItemsPerPage(input: any) {
          if (!input || input === "-" || isNaN(parseInt(input))) {
            return maxItemsPerPage;
          }
          return parseInt(input);
        }

        const getAllUsulan = await UsulanSmart.findAll();

        if (!getAllUsulan) {
          return res.status(404).json({
            success: true,
            status: 404,
            message: {
              error: "Data Tidak Ditemukan",
            },
          });
        }

        const dataUsulanFix = await Promise.all(
          getAllUsulan.map(async (item: any) => {
            const getUser: any = await User.findByPk(item.user_id);
            const getNamaOpd: any = await Opd.findByPk(getUser.opd_id);
            const getAllProgres: any = await Progres.findAll({
              where: { usulan_id: item.id },
            });
            const getKategori: any = await Kategori.findByPk(item.kategori_id); // Mengambil kategori berdasarkan kategori_id

            const itemsData = getAllProgres.map((progressItem: any) => {
              const Tanggal = new Date(progressItem.tanggal);
              const options: Intl.DateTimeFormatOptions = {
                day: "numeric",
                month: "long",
                year: "numeric",
              };

              const formattedDate = new Intl.DateTimeFormat(
                "id-ID",
                options
              ).format(Tanggal);

              return {
                tanggal: formattedDate,
                deskripsi_kegiatan: progressItem.deskripsi_kegiatan,
                gambar: path.join(
                  __dirname,
                  "../../public/foto-dokumentasi",
                  progressItem.foto_kegiatan
                ),
              };
            });

            return {
              nama_inovasi: item.nama_inovasi,
              nama_dinas: getNamaOpd.nama_opd,
              deskripsi_inovasi: item.deskripsi_inovasi,
              regulasi: item.regulasi,
              dokumentasi: item.dokumentasi,
              tahun: item.tahun,
              kategori: getKategori.jenis_smart,
              items: itemsData,
            };
          })
        );
        dataUsulanFix.sort((a: any, b: any) =>
          a.nama_dinas.localeCompare(b.nama_dinas)
        );

        const groupedData = dataUsulanFix.reduce((acc: any, curr: any) => {
          if (!acc[curr.kategori]) {
            acc[curr.kategori] = [];
          }
          acc[curr.kategori].push(curr);
          return acc;
        }, {});

        const logoPath = path.join(__dirname, "../../utils/Logo.png");
        const logoBase64 = fsLink.readFileSync(logoPath, "base64");

        const generateHtmlContent = (data: any) => {
          const kategoriNames: any = {
            "smart governance": "Smart Governance",
            "smart branding": "Smart Branding",
            "smart living": "Smart Living",
            "smart society": "Smart Society",
            "smart economy": "Smart Economy",
            "smart environment": "Smart Environment",
          };

          let finalHtml = "";
          Object.keys(kategoriNames).forEach((kategori) => {
            if (groupedData[kategori]) {
              let inovasiHtml = "";
              let previousNamaDinas = "";

              groupedData[kategori].forEach((inovasi: any, index: any) => {
                if (inovasi.nama_dinas !== previousNamaDinas) {
                  if (previousNamaDinas !== "") {
                    inovasiHtml += `<div style="margin-bottom: 30px;"></div>`;
                  }
                  inovasiHtml += `
          <table style="margin-bottom: 8px; margin-left: -4px !important; margin-top: 10px !important; background: #96C9F4 !important; ">
            <tr>
              <td><strong style="font-size: 12px">Nama OPD</strong></td>
              <td>:</td>
              <td><strong style="font-size: 12px">${inovasi.nama_dinas}</strong></td>
            </tr>
          </table>`;
                  previousNamaDinas = inovasi.nama_dinas;
                }
                inovasiHtml += `
         
          <table style="border-collapse: collapse; width: 100%; text-transform: capitalize;">
            <tr>
              <th style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px !important;">No</th>
              <th style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px !important;">Nama Inovasi</th>
              <th style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px !important;">Deskripsi Inovasi</th>
              <th style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px !important;">File Regulasi</th>
              <th style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px !important;">File Dokumentasi</th>
              <th style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px !important;">Tahun</th>
            </tr>
            <tr>
              <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">${
                index + 1
              }</td>
              <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">${
                inovasi.nama_inovasi
              }</td>
              <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">${
                inovasi.deskripsi_inovasi
              }</td>
              <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;"><a href="${
                inovasi.regulasi
              }">Link</a></td>
              <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;"><a href="${
                inovasi.dokumentasi
              }">Link</a></td>
              <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">${
                inovasi.tahun
              }</td>
            </tr>
           `;

                if (inovasi.items.length === 0) {
                  inovasiHtml += `
        <tr>
          <td colspan="6" style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px; background-color: #f8d7da; font-weight:bold !important;">Progres Kegiatan</td>
        </tr>
        <tr>
          <td colspan="6" style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px; background-color: #f8d7da;">Tidak ada progres sama sekali</td>
        </tr>`;
                } else {
                  inovasiHtml += `
        <tr>
          <td colspan="6" style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px; background-color: #d4edda; font-weight:bold !important;">Progres Kegiatan</td>
        </tr>`;
                  inovasi.items.forEach((item: any, itemIndex: number) => {
                    const dokumentasiPath = item.gambar;
                    const dokumentasi64 = fsLink.readFileSync(
                      dokumentasiPath,
                      "base64"
                    );
                    inovasiHtml += `
          <tr>
            <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">${
              itemIndex + 1
            }</td>
            <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">${
              item.tanggal
            }</td>
            <td colspan="2" style="border: 1px solid #080808; text-align: center; padding: 25px !important; font-size: 12px;">${
              item.deskripsi_kegiatan
            }</td>
            <td colspan="2" style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">
              <img src="data:image/png;base64,${dokumentasi64}" alt="Logo" style="width: 50px" />
            </td>
          </tr>`;
                  });
                }

                inovasiHtml += `</table>`;
                const itemsPerPage = getItemsPerPage(itemPerhalaman);
                if ((index + 1) % itemsPerPage === 0) {
                  inovasiHtml += `<div style="page-break-before: always; margin-top: 100px !important;"></div>`;
                }
              });

              finalHtml += `
      <table style="border-collapse: collapse; width: 100%; text-transform: capitalize; margin-bottom: 6px !important;">
        <thead>
          <tr>
            <th style="border: 1px solid #080808; text-align: left !important; padding: 4px; font-size: 10px; background-color: #29569f !important; color: white;">
              <h1 style="font-size: 14px">${kategoriNames[kategori]}</h1>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #080808; padding: 4px; font-size: 10px; text-align: left;">
              <div style="margin: 0px 40px 0 40px !important;">
                ${inovasiHtml}
              </div>
            </td>
          </tr>
        </tbody>
      </table>`;
            }
          });

          return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Document</title>
      <style>
        * {
          font-family: Arial, Helvetica, sans-serif;
          margin: 4px 8px 0px 8px;
        }
        h2 {
          display: block;
          margin: auto;
          text-align: center;
          margin-bottom: 8px;
          font-family: sans-serif;
          font-size: 1px;
        }

        hr {
            border: none !important;
                border-bottom: 4.5pt solid black !important;
                margin-top: -20px !important;
        }

        h3 {
          font-size: 15px !important;
        }

        .tabel-kop,
        .kop td,
        .kop th {
          border: none !important;
          padding: 2px;
          font-size: 11px;
        }

        .kop img {
          width: 50px;
        }
      </style>
    </head>
    <body>
      <table class="tabel-kop" style="width: 100%; text-align: center; margin-bottom: 20px">
        <tr>
          <td class="kop" style="width: 10%">
            <img src="data:image/png;base64,${logoBase64}" alt="Logo" style="width: 70%" />
          </td>
          <td class="kop">
            <h3 style="text-align: center; font-size: 16px !important">PEMERINTAH KABUPATEN BANYUASIN</h3>
            <h3 style="text-align: center; font-size: 18px !important">DINAS KOMUNIKASI, INFORMATIKA STATISTIK DAN PERSANDIAN</h3>
            <h5 style="text-align: center; font-size: 9px !important">KOMPLEK PERKANTORAN PEMERINTAH KABUPATEN BANYUASIN</h5>
            <p style="text-align: center; font-size: 9px !important">
              Jl. Ishak Usman No. 24 Pangkalan Balai, Provinsi Sumatera Selatan Telp. 0711-7690014/Fax.0711-7690099
            </p>
            <p style="text-align: center">
              Email : Diskominfo@banyuasinkab.go.id Website :http://diskominfo.banyuasinkab.go.id
            </p>
          </td>
        </tr>
      </table>
      <hr style="margin-top: -15px; margin-bottom: 20px" border: 3px solid black !important;/>

      <h3 style="text-align: center; margin-bottom: 8px;">Rekap Data Inovasi Kabupaten Banyuasin</h3>
       ${finalHtml}
     
    </body>
    </html>`;
        };

        const htmlContent = generateHtmlContent(dataUsulanFix);
        const options = {
          width: "210mm",
          height: "330mm",
        };
        pdf
          .create(htmlContent, options)
          .toFile("Rekap_Usulan.pdf", (err, result) => {
            if (err) {
              console.error("Error creating PDF:", err);
              return res.status(500).send("Error creating PDF");
            }

            // Mengirim file PDF sebagai respons
            const pdfPath = path.resolve(result.filename);
            res.setHeader(
              "Content-Disposition",
              'attachment; filename="Rekap_Usulan.pdf"'
            );
            res.setHeader("Content-Type", "application/pdf");

            res.sendFile(pdfPath, (err) => {
              if (err) {
                console.error("Error sending file:", err);
                return res.status(500).send("Error sending file");
              }

              fsLink.unlinkSync(pdfPath);
            });
          });
      } else if (jenis_report === "notsemua") {
        const { user_id } = req.body;
        const maxItemsPerPage = 13;

        function getItemsPerPage(input: any) {
          if (!input || input === "-" || isNaN(parseInt(input))) {
            return maxItemsPerPage;
          }
          return parseInt(input);
        }

        if (user_id === undefined) {
          return res.status(400).json({ error: "user_id is undefined" });
        }

        try {
          const getOpdId: any = await User.findOne({
            where: {
              opd_id: user_id,
            },
          });

          if (!getOpdId) {
            return res.status(404).json({
              success: false,
              status: 404,
              message: "User not found",
            });
          }

          // Ambil semua usulan yang terkait dengan user_id tersebut
          const getAllUsulan = await UsulanSmart.findAll({
            where: {
              user_id: getOpdId.id, // Gunakan id dari User yang ditemukan sebelumnya
            },
          });

          if (!getAllUsulan || getAllUsulan.length === 0) {
            return res.status(404).json({
              success: false,
              status: 404,
              message: "Data Tidak Ditemukan",
            });
          }

          const dataUsulanFix = await Promise.all(
            getAllUsulan.map(async (item: any) => {
              const getUser: any = await User.findByPk(item.user_id);
              const getNamaOpd: any = await Opd.findByPk(getUser.opd_id);
              const getAllProgres: any = await Progres.findAll({
                where: { usulan_id: item.id },
              });
              const getKategori: any = await Kategori.findByPk(
                item.kategori_id
              ); // Mengambil kategori berdasarkan kategori_id

              const itemsData = getAllProgres.map((progressItem: any) => {
                const Tanggal = new Date(progressItem.tanggal); // Konversi tanggal ke objek Date
                const options: Intl.DateTimeFormatOptions = {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                };

                const formattedDate = new Intl.DateTimeFormat(
                  "id-ID",
                  options
                ).format(Tanggal);

                return {
                  tanggal: formattedDate,
                  deskripsi_kegiatan: progressItem.deskripsi_kegiatan,
                  gambar: path.join(
                    __dirname,
                    "../../public/foto-dokumentasi",
                    progressItem.foto_kegiatan
                  ),
                };
              });

              return {
                nama_inovasi: item.nama_inovasi,
                nama_dinas: getNamaOpd.nama_opd,
                deskripsi_inovasi: item.deskripsi_inovasi,
                regulasi: item.regulasi,
                dokumentasi: item.dokumentasi,
                tahun: item.tahun,
                kategori: getKategori.jenis_smart,
                items: itemsData,
              };
            })
          );
          dataUsulanFix.sort((a: any, b: any) =>
            a.nama_dinas.localeCompare(b.nama_dinas)
          );

          const groupedData = dataUsulanFix.reduce((acc: any, curr: any) => {
            if (!acc[curr.kategori]) {
              acc[curr.kategori] = [];
            }
            acc[curr.kategori].push(curr);
            return acc;
          }, {});

          const logoPath = path.join(__dirname, "../../utils/Logo.png");
          const logoBase64 = fsLink.readFileSync(logoPath, "base64");

          const generateHtmlContent = (data: any) => {
            const kategoriNames: any = {
              "smart governance": "Smart Governance",
              "smart branding": "Smart Branding",
              "smart living": "Smart Living",
              "smart society": "Smart Society",
              "smart economy": "Smart Economy",
              "smart environment": "Smart Environment",
            };

            let finalHtml = "";
            Object.keys(kategoriNames).forEach((kategori) => {
              if (groupedData[kategori]) {
                let inovasiHtml = "";
                let previousNamaDinas = "";

                groupedData[kategori].forEach((inovasi: any, index: any) => {
                  if (inovasi.nama_dinas !== previousNamaDinas) {
                    if (previousNamaDinas !== "") {
                      inovasiHtml += `<div style="margin-bottom: 30px;"></div>`;
                    }
                    inovasiHtml += `
          <table style="margin-bottom: 8px; margin-left: -4px !important; margin-top: 10px !important; background: #96C9F4 !important; ">
            <tr>
              <td><strong style="font-size: 12px">Nama OPD</strong></td>
              <td>:</td>
              <td><strong style="font-size: 12px">${inovasi.nama_dinas}</strong></td>
            </tr>
          </table>`;
                    previousNamaDinas = inovasi.nama_dinas;
                  }
                  inovasiHtml += `
         
          <table style="border-collapse: collapse; width: 100%; text-transform: capitalize;">
            <tr>
              <th style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px !important;">No</th>
              <th style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px !important;">Nama Inovasi</th>
              <th style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px !important;">Deskripsi Inovasi</th>
              <th style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px !important;">File Regulasi</th>
              <th style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px !important;">File Dokumentasi</th>
              <th style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px !important;">Tahun</th>
            </tr>
            <tr>
              <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">${
                index + 1
              }</td>
              <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">${
                inovasi.nama_inovasi
              }</td>
              <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">${
                inovasi.deskripsi_inovasi
              }</td>
              <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;"><a href="${
                inovasi.regulasi
              }">Link</a></td>
              <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;"><a href="${
                inovasi.dokumentasi
              }">Link</a></td>
              <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">${
                inovasi.tahun
              }</td>
            </tr>
           `;

                  if (inovasi.items.length === 0) {
                    inovasiHtml += `
        <tr>
          <td colspan="6" style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px; background-color: #f8d7da; font-weight:bold !important;">Progres Kegiatan</td>
        </tr>
        <tr>
          <td colspan="6" style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px; background-color: #f8d7da;">Tidak ada progres sama sekali</td>
        </tr>`;
                  } else {
                    inovasiHtml += `
        <tr>
          <td colspan="6" style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px; background-color: #d4edda; font-weight:bold !important;">Progres Kegiatan</td>
        </tr>`;
                    inovasi.items.forEach((item: any, itemIndex: number) => {
                      const dokumentasiPath = item.gambar;
                      const dokumentasi64 = fsLink.readFileSync(
                        dokumentasiPath,
                        "base64"
                      );
                      inovasiHtml += `
          <tr>
            <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">${
              itemIndex + 1
            }</td>
            <td style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">${
              item.tanggal
            }</td>
            <td colspan="2" style="border: 1px solid #080808; text-align: center; padding: 25px !important; font-size: 12px;">${
              item.deskripsi_kegiatan
            }</td>
            <td colspan="2" style="border: 1px solid #080808; text-align: center; padding: 4px; font-size: 12px;">
              <img src="data:image/png;base64,${dokumentasi64}" alt="Logo" style="width: 50px" />
            </td>
          </tr>`;
                    });
                  }

                  inovasiHtml += `</table>`;
                  const itemsPerPage = getItemsPerPage(itemPerhalaman);
                  if ((index + 1) % itemsPerPage === 0) {
                    inovasiHtml += `<div style="page-break-before: always; margin-top: 100px !important;"></div>`;
                  }
                });

                finalHtml += `
      <table style="border-collapse: collapse; width: 100%; text-transform: capitalize; margin-bottom: 6px !important;">
        <thead>
          <tr>
            <th style="border: 1px solid #080808; text-align: left !important; padding: 4px; font-size: 10px; background-color: #29569f !important; color: white;">
              <h1 style="font-size: 14px">${kategoriNames[kategori]}</h1>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #080808; padding: 4px; font-size: 10px; text-align: left;">
              <div style="margin: 0px 40px 0 40px !important;">
                ${inovasiHtml}
              </div>
            </td>
          </tr>
        </tbody>
      </table>`;
              }
            });

            return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Document</title>
      <style>
        * {
          font-family: Arial, Helvetica, sans-serif;
          margin: 4px 8px 0px 8px;
        }
        h2 {
          display: block;
          margin: auto;
          text-align: center;
          margin-bottom: 8px;
          font-family: sans-serif;
          font-size: 1px;
        }

        hr {
            border: none !important;
                border-bottom: 4.5pt solid black !important;
                margin-top: -20px !important;
        }

        h3 {
          font-size: 15px !important;
        }

        .tabel-kop,
        .kop td,
        .kop th {
          border: none !important;
          padding: 2px;
          font-size: 11px;
        }

        .kop img {
          width: 50px;
        }
      </style>
    </head>
    <body>
      <table class="tabel-kop" style="width: 100%; text-align: center; margin-bottom: 20px">
        <tr>
          <td class="kop" style="width: 10%">
            <img src="data:image/png;base64,${logoBase64}" alt="Logo" style="width: 70%" />
          </td>
          <td class="kop">
            <h3 style="text-align: center; font-size: 16px !important">PEMERINTAH KABUPATEN BANYUASIN</h3>
            <h3 style="text-align: center; font-size: 18px !important">DINAS KOMUNIKASI, INFORMATIKA STATISTIK DAN PERSANDIAN</h3>
            <h5 style="text-align: center; font-size: 9px !important">KOMPLEK PERKANTORAN PEMERINTAH KABUPATEN BANYUASIN</h5>
            <p style="text-align: center; font-size: 9px !important">
              Jl. Ishak Usman No. 24 Pangkalan Balai, Provinsi Sumatera Selatan Telp. 0711-7690014/Fax.0711-7690099
            </p>
            <p style="text-align: center">
              Email : Diskominfo@banyuasinkab.go.id Website :http://diskominfo.banyuasinkab.go.id
            </p>
          </td>
        </tr>
      </table>
      <hr style="margin-top: -15px; margin-bottom: 20px" border: 3px solid black !important;/>

      <h3 style="text-align: center; margin-bottom: 8px;">Rekap Data Inovasi Kabupaten Banyuasin</h3>
       ${finalHtml}
     
    </body>
    </html>`;
          };

          const htmlContent = generateHtmlContent(dataUsulanFix);
          const options = {
            width: "210mm",
            height: "330mm",
          };
          pdf
            .create(htmlContent, options)
            .toFile("Rekap_Usulan.pdf", (err, result) => {
              if (err) {
                console.error("Error creating PDF:", err);
                return res.status(500).send("Error creating PDF");
              }

              // Mengirim file PDF sebagai respons
              const pdfPath = path.resolve(result.filename);
              res.setHeader(
                "Content-Disposition",
                'attachment; filename="Rekap_Usulan.pdf"'
              );
              res.setHeader("Content-Type", "application/pdf");

              res.sendFile(pdfPath, (err) => {
                if (err) {
                  console.error("Error sending file:", err);
                  return res.status(500).send("Error sending file");
                }

                fsLink.unlinkSync(pdfPath);
              });
            });
        } catch (error: any) {
          return res.status(500).json({
            success: false,
            status: 500,
            message: "Terjadi kesalahan dalam membuat PDF",
            error_message: error.message,
            stack_trace: error.stack,
          });
        }
      }
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: "Terjadi kesalahan dalam membuat PDF",
        error_message: error.message,
        stack_trace: error.stack,
      });
    }
  },

  exportDownloadZip: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const getAllDataByOpdId = await UsulanSmart.findAll();

      const opdList: any = await Promise.all(
        getAllDataByOpdId.map(async (item: any) => {
          const getUser: any = await User.findByPk(item.user_id);
          const getNamaOpd: any = await Opd.findByPk(getUser.opd_id);

          return {
            opdName: getNamaOpd.nama_opd,
            dokumentasi: item.dokumentasi,
            regulasi: item.regulasi,
            link_drive: item.link_drive,
          };
        })
      );

      const uniqueOpdList = Array.from(
        new Set(opdList.map((opd: any) => opd.opdName))
      );

      const uploadsFolderDokumen = path.join(
        __dirname,
        "../../public/usulan-smart/dokumentasi"
      );
      const uploadsFolderRegulasi = path.join(
        __dirname,
        "../../public/usulan-smart/berkas"
      );

      const outputZipPath = path.join(__dirname, "output.zip");
      const foldersToZip = ["dokumentasi", "regulasi", "kumpulan_link_drive"];

      try {
        await Promise.all(
          foldersToZip.map((folder) => {
            return Promise.all(
              uniqueOpdList.map((dinas: any) =>
                fsEkstra.ensureDir(path.join(__dirname, folder, dinas))
              )
            );
          })
        );
      } catch (err) {
        return res.status(500).send("Error creating folders");
      }

      const zipStream = fsEkstra.createWriteStream(outputZipPath);
      const archive = archiver("zip", {
        zlib: { level: 1 },
      });

      zipStream.on("close", async () => {
        try {
          res.download(outputZipPath, "output.zip", async (err) => {
            if (err) {
              console.error("Error downloading zip:", err);
              res.status(500).send("Error downloading zip");
              return;
            }

            try {
              await fsEkstra.unlink(outputZipPath);
            } catch (err) {}

            try {
              await Promise.all(
                foldersToZip.map(async (folder) => {
                  await fsEkstra.remove(path.join(__dirname, folder));
                })
              );
            } catch (err) {}
          });
        } catch (err) {
          res.status(500).send("Error in zipStream close event");
        }
      });

      archive.on("error", (err) => {
        res.status(500).send("Error creating zip file");
      });

      archive.pipe(zipStream);

      try {
        await Promise.all(
          opdList.map(async (item: any) => {
            const opdName = item.opdName;

            if (item.dokumentasi) {
              const dokumenFilePath = path.join(
                uploadsFolderDokumen,
                item.dokumentasi
              );
              if (await fsEkstra.pathExists(dokumenFilePath)) {
                archive.file(dokumenFilePath, {
                  name: `dokumentasi/${opdName}/${path.basename(
                    item.dokumentasi
                  )}`,
                });
              }
            }

            if (item.regulasi) {
              const regulasiFilePath = path.join(
                uploadsFolderRegulasi,
                item.regulasi
              );
              if (await fsEkstra.pathExists(regulasiFilePath)) {
                archive.file(regulasiFilePath, {
                  name: `regulasi/${opdName}/${path.basename(item.regulasi)}`,
                });
              }
            }

            if (item.link_drive) {
              const linkDrivePath = path.join(
                __dirname,
                `kumpulan_link_drive/${opdName}/link_drive.txt`
              );
              await fsEkstra.ensureFile(linkDrivePath);
              await fs.writeFile(linkDrivePath, item.link_drive, "utf8");
              archive.file(linkDrivePath, {
                name: `kumpulan_link_drive/${opdName}/link_drive.txt`,
              });
            }
          })
        );
      } catch (err) {
        return res.status(500).send("Error adding files to zip");
      }

      archive.finalize();
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: "Terjadi kesalahan dalam membuat PDF",
        error_message: error.message,
        stack_trace: error.stack,
      });
    }
  },

  exportDownloadByHitApi: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { jenis_report, user_id } = req.body;

      const requestData = {
        jenis_report,
        user_id,
      };

      // Menggunakan axios untuk mendapatkan file PDF
      const response = await axios.post(
        "http://127.0.0.1:8000/api/export-pdf",
        requestData,
        {
          responseType: "arraybuffer", // Memastikan kita menerima data biner
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Mendapatkan timestamp
      const timestamp = Date.now();
      const filename = `inovasi_${timestamp}.pdf`;

      // Mengatur header untuk mengunduh file
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.send(response.data); // Mengirim data PDF ke klien
    } catch (error: any) {
      console.error("Error while exporting PDF:", error);
      res.status(error.response?.status || 500).json({
        message: "Error while exporting PDF",
        error: error.message,
      });
    }
    //   const { jenis_report } = req.body;

    //   if (!jenis_report) {
    //     return res.status(400).json({
    //       success: false,
    //       status: 400,
    //       message: "Jenis rekap harus diisi",
    //     });
    //   }

    //   if (jenis_report === "semua") {
    //     try {
    //       const getAllUsulan = await UsulanSmart.findAll();
    //       if (!getAllUsulan) {
    //         return res.status(404).json({
    //           success: true,
    //           status: 404,
    //           message: {
    //             error: "Data Tidak Ditemukan",
    //           },
    //         });
    //       }

    //       let typeFileDokumentasi: any = null;
    //       let typeFileRegulasi: any = null;

    //       const dataUsulanFix = await Promise.all(
    //         getAllUsulan.map(async (item: any) => {
    //           const getUser: any = await User.findByPk(item.user_id);
    //           const getNamaOpd: any = await Opd.findByPk(getUser.opd_id);
    //           const getAllProgres: any = await Progres.findAll({
    //             where: { usulan_id: item.id },
    //           });
    //           const getKategori: any = await Kategori.findByPk(item.kategori_id); // Mengambil kategori berdasarkan kategori_id
    //           const itemsData = getAllProgres.map((progressItem: any) => {
    //             const Tanggal = new Date(progressItem.tanggal);
    //             const options: Intl.DateTimeFormatOptions = {
    //               day: "numeric",
    //               month: "long",
    //               year: "numeric",
    //             };
    //             const formattedDate = new Intl.DateTimeFormat(
    //               "id-ID",
    //               options
    //             ).format(Tanggal);
    //             const filePath = path.join(
    //               __dirname,
    //               "../../public/foto-dokumentasi",
    //               progressItem.foto_kegiatan
    //             );
    //             // Get MIME type
    //             let base64Image = "";
    //             const mimeType = mime.lookup(filePath);

    //             if (fsLink.existsSync(filePath)) {
    //               const imageBuffer = fsLink.readFileSync(filePath);
    //               base64Image = `data:${mimeType};base64,${imageBuffer.toString(
    //                 "base64"
    //               )}`;
    //             }
    //             if (mimeType && mimeType.startsWith("image/")) {
    //               return {
    //                 tanggal: formattedDate,
    //                 deskripsi_kegiatan: progressItem.deskripsi_kegiatan,
    //                 file_type: mimeType,
    //                 gambar: `https://siemas.banyuasinkab.go.id/api/progres/show/foto/${progressItem.id}/laporan`,
    //               };
    //             } else {
    //               return {
    //                 tanggal: formattedDate,
    //                 deskripsi_kegiatan: progressItem.deskripsi_kegiatan,
    //                 file_type: mimeType,
    //                 gambar: `https://siemas.banyuasinkab.go.id/api/progres/show/foto/${progressItem.id}/laporan`,
    //               };
    //             }
    //           });

    //           return {
    //             nama_inovasi: item.nama_inovasi,
    //             nama_dinas: getNamaOpd.nama_opd,
    //             deskripsi_inovasi: item.deskripsi_inovasi,
    //             regulasi: `http://localhost:8000/api/usulan/download/regulasi/${item.id}`,
    //             dokumentasi: `http://localhost:8000/api/usulan/download/dokumentasi/${item?.id}`,
    //             tahun: item.tahun,
    //             kategori: getKategori.jenis_smart,
    //             items: itemsData,
    //           };
    //         })
    //       );

    //       dataUsulanFix.sort((a: any, b: any) =>
    //         a.nama_dinas.localeCompare(b.nama_dinas)
    //       );

    //       // const axiosInstance = axios.create({
    //       //   baseURL: "https://exportpdf.banyuasinkab.go.id",
    //       //   httpsAgent: new (require("https").Agent)({
    //       //     rejectUnauthorized: false,
    //       //   }),
    //       // });
    //       // const response = await axiosInstance.post(
    //       //   "/api/export-pdf",
    //       //   {
    //       //     data: dataUsulanFix,
    //       //   },
    //       //   {
    //       //     responseType: "arraybuffer",
    //       //   }
    //       // );
    //       const axiosInstance = axios.create({
    //         baseURL: "http://127.0.0.1:8000",
    //         httpsAgent: new (require("https").Agent)({
    //           rejectUnauthorized: false,
    //         }),
    //       });
    //       const response = await axiosInstance.post(
    //         "/api/export-pdf",
    //         {
    //           data: dataUsulanFix,
    //         },
    //         {
    //           responseType: "arraybuffer",
    //         }
    //       );
    //       res.set("Content-Type", "application/pdf");
    //       res.send(response.data);
    //     } catch (error: any) {
    //       return res.status(500).json({
    //         success: false,
    //         status: 500,
    //         message: "Terjadi kesalahan dalam membuat PDF",
    //         error_message: error.message,
    //         stack_trace: error.stack,
    //       });
    //     }
    //   } else if (jenis_report === "peropd") {
    //     const { user_id } = req.body;
    //     if (user_id === undefined) {
    //       return res.status(400).json({ error: "user_id is undefined" });
    //     }

    //     try {
    //       const getOpdId: any = await User.findOne({
    //         where: {
    //           opd_id: user_id,
    //         },
    //       });

    //       if (!getOpdId) {
    //         return res.status(404).json({
    //           success: false,
    //           status: 404,
    //           message: "Opd Tidak Ada",
    //         });
    //       }

    //       const getAllUsulan = await UsulanSmart.findAll({
    //         where: {
    //           user_id: getOpdId.id, // Gunakan id dari User yang ditemukan sebelumnya
    //         },
    //       });

    //       console.log(getAllUsulan);

    //       if (!getAllUsulan || getAllUsulan.length === 0) {
    //         return res.status(404).json({
    //           success: false,
    //           status: 404,
    //           message: "Data Tidak Ditemukan",
    //         });
    //       }

    //       let typeFileDokumentasi: any = null;
    //       let typeFileRegulasi: any = null;

    //       const dataUsulanFix = await Promise.all(
    //         getAllUsulan.map(async (item: any) => {
    //           const getUser: any = await User.findByPk(item.user_id);
    //           const getNamaOpd: any = await Opd.findByPk(getUser.opd_id);
    //           const getAllProgres: any = await Progres.findAll({
    //             where: { usulan_id: item.id },
    //           });
    //           const getKategori: any = await Kategori.findByPk(item.kategori_id); // Mengambil kategori berdasarkan kategori_id
    //           const itemsData = getAllProgres.map((progressItem: any) => {
    //             const Tanggal = new Date(progressItem.tanggal);
    //             const options: Intl.DateTimeFormatOptions = {
    //               day: "numeric",
    //               month: "long",
    //               year: "numeric",
    //             };
    //             const formattedDate = new Intl.DateTimeFormat(
    //               "id-ID",
    //               options
    //             ).format(Tanggal);
    //             const filePath = path.join(
    //               __dirname,
    //               "../../public/foto-dokumentasi",
    //               progressItem.foto_kegiatan
    //             );
    //             // Get MIME type
    //             let base64Image = "";
    //             const mimeType = mime.lookup(filePath);

    //             if (fsLink.existsSync(filePath)) {
    //               const imageBuffer = fsLink.readFileSync(filePath);
    //               base64Image = `data:${mimeType};base64,${imageBuffer.toString(
    //                 "base64"
    //               )}`;
    //             }
    //             if (mimeType && mimeType.startsWith("image/")) {
    //               return {
    //                 tanggal: formattedDate,
    //                 deskripsi_kegiatan: progressItem.deskripsi_kegiatan,
    //                 file_type: mimeType,
    //                 gambar: base64Image,
    //               };
    //             } else {
    //               return {
    //                 tanggal: formattedDate,
    //                 deskripsi_kegiatan: progressItem.deskripsi_kegiatan,
    //                 file_type: mimeType,
    //                 gambar: `https://siemas.banyuasinkab.go.id/api/progres/show/foto/${progressItem.id}/laporan`,
    //               };
    //             }
    //           });

    //           // file dokumentasi
    //           if (item.dokumentasi) {
    //             const dokumentasiPath: any = path.join(
    //               __dirname,
    //               "../../public/usulan-smart/dokumentasi",
    //               item.dokumentasi
    //             );
    //             let base64Image = "";
    //             const typeDataFix = mime.lookup(dokumentasiPath);

    //             if (typeDataFix && typeDataFix.startsWith("image/")) {
    //               try {
    //                 const imageBuffer = fsLink.readFileSync(dokumentasiPath);
    //                 base64Image = `data:${typeDataFix};base64,${imageBuffer.toString(
    //                   "base64"
    //                 )}`;

    //                 typeFileDokumentasi = {
    //                   file_type: typeDataFix,
    //                   url: `https://siemas.banyuasinkab.go.id/api/usulan/download/dokumentasi/${item?.id}`,
    //                   file: base64Image,
    //                 };
    //               } catch (error) {
    //                 typeFileDokumentasi = {
    //                   file_type: null,
    //                   file: null,
    //                 };
    //               }
    //             } else {
    //               typeFileDokumentasi = {
    //                 file_type: typeDataFix,
    //                 file: `https://siemas.banyuasinkab.go.id/api/usulan/download/dokumentasi/${item?.id}`,
    //               };
    //             }
    //           }

    //           if (item.regulasi) {
    //             const regulasiPath = path.join(
    //               __dirname,
    //               "../../public/usulan-smart/berkas",
    //               item.regulasi
    //             );

    //             let base64Image = "";
    //             const typeDataFix = mime.lookup(regulasiPath);

    //             if (typeDataFix && typeDataFix.startsWith("image/")) {
    //               try {
    //                 const imageBuffer = fsLink.readFileSync(regulasiPath);
    //                 base64Image = `data:${typeDataFix};base64,${imageBuffer.toString(
    //                   "base64"
    //                 )}`;

    //                 typeFileRegulasi = {
    //                   file_type: typeDataFix,
    //                   url: `https://siemas.banyuasinkab.go.id/api/usulan/download/regulasi/${item.id}`,
    //                   file: base64Image,
    //                 };
    //               } catch (error) {
    //                 typeFileRegulasi = {
    //                   file_type: null,
    //                   file: null,
    //                 };
    //               }
    //             } else {
    //               typeFileRegulasi = {
    //                 file_type: typeDataFix,
    //                 file: `https://siemas.banyuasinkab.go.id/api/usulan/download/regulasi/${item.id}`,
    //               };
    //             }
    //           } else {
    //             typeFileRegulasi = {
    //               file_type: null,
    //               file: null,
    //             };
    //           }

    //           return {
    //             nama_inovasi: item.nama_inovasi,
    //             nama_dinas: getNamaOpd.nama_opd,
    //             deskripsi_inovasi: item.deskripsi_inovasi,
    //             regulasi: typeFileRegulasi,
    //             dokumentasi: typeFileDokumentasi,
    //             tahun: item.tahun,
    //             kategori: getKategori.jenis_smart,
    //             items: itemsData,
    //           };
    //         })
    //       );

    //       dataUsulanFix.sort((a: any, b: any) =>
    //         a.nama_dinas.localeCompare(b.nama_dinas)
    //       );

    //       // const axiosInstance = axios.create({
    //       //   baseURL: "https://exportpdf.banyuasinkab.go.id",
    //       //   httpsAgent: new (require("https").Agent)({
    //       //     rejectUnauthorized: false,
    //       //   }),
    //       // });
    //       //127.0.0.1:8000/api/export-pdf
    //       const axiosInstance = axios.create({
    //         baseURL: "http://127.0.0.1:8000",
    //         httpsAgent: new (require("https").Agent)({
    //           rejectUnauthorized: false,
    //         }),
    //       });
    //       // const response = await axiosInstance.post(
    //       //   "/api/export-pdf",
    //       //   {
    //       //     data: dataUsulanFix,
    //       //   },
    //       //   {
    //       //     responseType: "arraybuffer",
    //       //   }
    //       // );
    //       const response = await axiosInstance.post(
    //         "/api/export-pdf",
    //         {
    //           data: dataUsulanFix,
    //         },
    //         {
    //           responseType: "arraybuffer",
    //         }
    //       );
    //       res.set("Content-Type", "application/pdf");
    //       res.send(response.data);
    //     } catch (error: any) {
    //       return res.status(500).json({
    //         success: false,
    //         status: 500,
    //         message: "Terjadi kesalahan dalam membuat PDF",
    //         error_message: error.message,
    //         stack_trace: error.stack,
    //       });
    //     }
    //   } else {
    //     return res.status(400).json({
    //       success: false,
    //       status: 400,
    //       message: "Jenis rekap yang dipilih salah",
    //     });
    //   }
  },
};

export default usulanSmartController;
