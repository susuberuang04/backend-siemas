import { Request, Response, NextFunction, response } from "express";
import { models, sequelize } from "../../database/models";
const { QueryTypes } = require("sequelize");
import multer from "multer";
import path from "path";
import fsLink from "fs";
import fs from "fs/promises";
const { UsulanSmart, Kategori, Tracking, Notifikasi } = models;
import { io } from "../../app";
import { LogError } from "../../database/models/logerror";
require("dotenv").config();
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
      ".ppt",
      ".xlsx",
      ".xls",
    ],
    dokumentasi: [
      ".png",
      ".jpg",
      ".jpeg",
      ".heic",
      ".pdf",
      ".docx",
      ".ppt",
      ".doc",
      ".pptx",
      ".xlsx",
      ".xls",
    ],
  };

  const extname = path.extname(file.originalname).toLowerCase();
  const fieldExtensions =
    allowedExtensions[file.fieldname.replace(/\[\d+\](\[\d+\])?$/, "")];

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
    fileSize: 10 * 1024 * 1024, // 10MB
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

// codingan multer untuk edit data:
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

const fileFilterTwo = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions: Record<string, string[]> = {
    regulasi: [
      ".png",
      ".jpg",
      ".ppt",
      ".jpeg",
      ".heic",
      ".pdf",
      ".docx",
      ".doc",
      ".pptx",
      ".xlsx",
      ".xls",
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
      ".ppt",
      ".xlsx",
      ".xls",
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

const uploadTwo = multer({
  storage: storageTwo,
  fileFilter: fileFilterTwo,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file
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

  return null;
};

const inovasiSmartController = {
  updateApiTambahInovasi: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    upload(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Batas ukuran file adalah 10MB!",
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

        // Validasi input (misal)
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

        // Proses data inovasi satu per satu
        const dataToInsert = nama_inovasi.map((_: string, i: number) => {
          // Filter file regulasi dan dokumentasi untuk inovasi ke-i dengan index yang lebih dalam
          const regulasiFiles = files
            .filter((f) => f.fieldname.startsWith(`regulasi[${i}]`))
            .map((f) => f.filename);

          const dokumentasiFiles = files
            .filter((f) => f.fieldname.startsWith(`dokumentasi[${i}]`))
            .map((f) => f.filename);

          // Hitung total ukuran file regulasi + dokumentasi untuk setiap inovasi
          const totalFileSize = files
            .filter(
              (f) =>
                f.fieldname.startsWith(`regulasi[${i}]`) ||
                f.fieldname.startsWith(`dokumentasi[${i}]`)
            )
            .reduce((acc, curr) => acc + curr.size, 0);

          // Batasi total ukuran file untuk setiap inovasi 10MB
          if (totalFileSize > 10 * 1024 * 1024) {
            throw new Error(
              `Total ukuran file inovasi ke-${i + 1} melebihi 10MB`
            );
          }

          return {
            nama_inovasi: nama_inovasi[i],
            deskripsi_inovasi: deskripsi_inovasi[i],
            regulasi: JSON.stringify(regulasiFiles), // Simpan sebagai array JSON
            dokumentasi: JSON.stringify(dokumentasiFiles), // Simpan sebagai array JSON
            tahun: tahun[i],
            link_drive: link_drive[i] || null,
            user_id: user_id[i],
            kategori_id: kategori_id[i],
          };
        });

        // Insert data ke database
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
          raw: true,
        });

        // Buat dictionary untuk memetakan kategori_id ke kategori_nama
        const kategoriMap = kategoris.reduce((map: any, kategori: any) => {
          map[kategori.id] = kategori.jenis_smart;
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
          message: error.message,
        });
      }
    });
  },

  updateApiUpdateInovasi: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    uploadTwo.fields([{ name: "dokumentasi" }, { name: "regulasi" }])(
      req,
      res,
      async function (err) {
        if (err) {
          return res.status(400).json({
            success: false,
            status: 400,
            message: { error: err.message },
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
            removedFiles = [],
          } = req.body;

          const existingUsulan: any = await UsulanSmart.findByPk(usulanId);
          if (!existingUsulan) {
            return res.status(404).json({
              success: false,
              status: 404,
              message: { error: "Usulan tidak ditemukan" },
            });
          }

          // Konversi regulasi dan dokumentasi ke array jika masih dalam bentuk string atau null
          const oldDokumentasi = Array.isArray(existingUsulan.dokumentasi)
            ? existingUsulan.dokumentasi
            : existingUsulan.dokumentasi &&
              existingUsulan.dokumentasi.startsWith("[") &&
              existingUsulan.dokumentasi.endsWith("]")
            ? JSON.parse(existingUsulan.dokumentasi)
            : existingUsulan.dokumentasi
            ? [existingUsulan.dokumentasi]
            : [];

          const oldRegulasi = Array.isArray(existingUsulan.regulasi)
            ? existingUsulan.regulasi
            : existingUsulan.regulasi &&
              existingUsulan.regulasi.startsWith("[") &&
              existingUsulan.regulasi.endsWith("]")
            ? JSON.parse(existingUsulan.regulasi)
            : existingUsulan.regulasi
            ? [existingUsulan.regulasi]
            : [];

          // Filter out files in removedFiles from dokumentasi and regulasi
          const updatedDokumentasi = oldDokumentasi.filter(
            (file: any) => !removedFiles.includes(file)
          );
          const updatedRegulasi = oldRegulasi.filter(
            (file: any) => !removedFiles.includes(file)
          );

          // Hapus file dari filesystem yang ada di removedFiles
          removedFiles.forEach((file: any) => {
            const filePathDokumentasi = path.join(
              __dirname,
              `../../public/usulan-smart/dokumentasi/${file}`
            );
            const filePathRegulasi = path.join(
              __dirname,
              `../../public/usulan-smart/berkas/${file}`
            );

            if (
              oldDokumentasi.includes(file) &&
              fsLink.existsSync(filePathDokumentasi)
            ) {
              fsLink.unlinkSync(filePathDokumentasi);
            }

            if (
              oldRegulasi.includes(file) &&
              fsLink.existsSync(filePathRegulasi)
            ) {
              fsLink.unlinkSync(filePathRegulasi);
            }
          });

          // Append new uploaded files to dokumentasi and regulasi arrays
          const files = req.files as {
            dokumentasi?: Express.Multer.File[];
            regulasi?: Express.Multer.File[];
          };

          if (files.dokumentasi) {
            files.dokumentasi.forEach((file) =>
              updatedDokumentasi.push(file.filename)
            );
          }
          if (files.regulasi) {
            files.regulasi.forEach((file) =>
              updatedRegulasi.push(file.filename)
            );
          }

          // Update record with new data, ensuring all data is in array format
          await existingUsulan.update(
            {
              nama_inovasi,
              deskripsi_inovasi,
              tahun,
              user_id,
              kategori_id,
              link_drive,
              dokumentasi: JSON.stringify(updatedDokumentasi), // Simpan sebagai array JSON
              regulasi: JSON.stringify(updatedRegulasi), // Simpan sebagai array JSON
            },
            { transaction }
          );

          await transaction.commit();

          res.status(201).json({
            success: true,
            status: 201,
            message: "Data berhasil diupdate",
            result: existingUsulan,
          });
        } catch (error: any) {
          await transaction.rollback();
          return res.status(500).json({
            success: false,
            status: 500,
            message: error.message,
          });
        }
      }
    );
  },

  // updateApiUpdateInovasi: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   // data fiks:
  //   uploadTwo.fields([{ name: "dokumentasi" }, { name: "regulasi" }])(
  //     req,
  //     res,
  //     async function (err) {
  //       if (err) {
  //         return res.status(400).json({
  //           success: false,
  //           status: 400,
  //           message: { error: err.message },
  //         });
  //       }

  //       const transaction = await sequelize.transaction();
  //       const usulanId = req.params.id;

  //       try {
  //         const {
  //           nama_inovasi,
  //           deskripsi_inovasi,
  //           tahun,
  //           user_id,
  //           kategori_id,
  //           link_drive,
  //           removedFiles = [],
  //         } = req.body;

  //         const existingUsulan: any = await UsulanSmart.findByPk(usulanId);
  //         if (!existingUsulan) {
  //           return res.status(404).json({
  //             success: false,
  //             status: 404,
  //             message: { error: "Usulan tidak ditemukan" },
  //           });
  //         }

  //         // Konversi regulasi dan dokumentasi ke array jika masih dalam bentuk string
  //         const oldDokumentasi = Array.isArray(existingUsulan.dokumentasi)
  //           ? existingUsulan.dokumentasi
  //           : existingUsulan.dokumentasi.startsWith("[") &&
  //             existingUsulan.dokumentasi.endsWith("]")
  //           ? JSON.parse(existingUsulan.dokumentasi)
  //           : [existingUsulan.dokumentasi];

  //         const oldRegulasi = Array.isArray(existingUsulan.regulasi)
  //           ? existingUsulan.regulasi
  //           : existingUsulan.regulasi.startsWith("[") &&
  //             existingUsulan.regulasi.endsWith("]")
  //           ? JSON.parse(existingUsulan.regulasi)
  //           : [existingUsulan.regulasi];

  //         // Filter out files in removedFiles from dokumentasi and regulasi
  //         const updatedDokumentasi = oldDokumentasi.filter(
  //           (file: any) => !removedFiles.includes(file)
  //         );
  //         const updatedRegulasi = oldRegulasi.filter(
  //           (file: any) => !removedFiles.includes(file)
  //         );

  //         // Hapus file dari filesystem yang ada di removedFiles
  //         removedFiles.forEach((file: any) => {
  //           const filePathDokumentasi = path.join(
  //             __dirname,
  //             `../../public/usulan-smart/dokumentasi/${file}`
  //           );
  //           const filePathRegulasi = path.join(
  //             __dirname,
  //             `../../public/usulan-smart/berkas/${file}`
  //           );

  //           if (
  //             oldDokumentasi.includes(file) &&
  //             fsLink.existsSync(filePathDokumentasi)
  //           ) {
  //             fsLink.unlinkSync(filePathDokumentasi);
  //           }

  //           if (
  //             oldRegulasi.includes(file) &&
  //             fsLink.existsSync(filePathRegulasi)
  //           ) {
  //             fsLink.unlinkSync(filePathRegulasi);
  //           }
  //         });

  //         // Append new uploaded files to dokumentasi and regulasi arrays
  //         const files = req.files as {
  //           dokumentasi?: Express.Multer.File[];
  //           regulasi?: Express.Multer.File[];
  //         };

  //         if (files.dokumentasi) {
  //           files.dokumentasi.forEach((file) =>
  //             updatedDokumentasi.push(file.filename)
  //           );
  //         }
  //         if (files.regulasi) {
  //           files.regulasi.forEach((file) =>
  //             updatedRegulasi.push(file.filename)
  //           );
  //         }

  //         // Update record with new data, ensuring all data is in array format
  //         await existingUsulan.update(
  //           {
  //             nama_inovasi,
  //             deskripsi_inovasi,
  //             tahun,
  //             user_id,
  //             kategori_id,
  //             link_drive,
  //             dokumentasi: JSON.stringify(updatedDokumentasi), // Simpan sebagai array JSON
  //             regulasi: JSON.stringify(updatedRegulasi), // Simpan sebagai array JSON
  //           },
  //           { transaction }
  //         );

  //         await transaction.commit();

  //         res.status(201).json({
  //           success: true,
  //           status: 201,
  //           message: "Data berhasil diupdate",
  //           result: existingUsulan,
  //         });
  //       } catch (error: any) {
  //         await transaction.rollback();
  //         return res.status(500).json({
  //           success: false,
  //           status: 500,
  //           message: error.message,
  //         });
  //       }
  //     }
  //   );
  // },

  // updateApiTambahInovasi: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   upload(req, res, async function (err) {
  //     if (err instanceof multer.MulterError) {
  //       if (err.code === "LIMIT_FILE_SIZE") {
  //         return res.status(400).json({
  //           success: false,
  //           status: 400,
  //           message: {
  //             error: "Batas ukuran file adalah 10MB!",
  //           },
  //         });
  //       } else {
  //         return res.status(400).json({
  //           success: false,
  //           status: 400,
  //           message: {
  //             error: err.message,
  //           },
  //         });
  //       }
  //     } else if (err) {
  //       return res.status(400).json({
  //         success: false,
  //         status: 400,
  //         message: {
  //           error: err.message,
  //         },
  //       });
  //     }

  //     const transaction = await sequelize.transaction();

  //     try {
  //       const files = req.files as Express.Multer.File[];

  //       // Validasi input (misal)
  //       const validationError = validateInput(req, files, res);
  //       if (validationError) return validationError;

  //       const {
  //         nama_inovasi,
  //         tahun,
  //         user_id,
  //         kategori_id,
  //         deskripsi_inovasi,
  //         link_drive,
  //       } = req.body;

  //       const dataToInsert = nama_inovasi.map((_: string, i: number) => {
  //         // Filter file regulasi dan dokumentasi untuk inovasi ke-i
  //         const regulasiFiles = files
  //           .filter((f) => f.fieldname.startsWith(`regulasi[${i}]`))
  //           .map((f) => f.filename);

  //         const dokumentasiFiles = files
  //           .filter((f) => f.fieldname.startsWith(`dokumentasi[${i}]`))
  //           .map((f) => f.filename);

  //         // Hitung total ukuran file regulasi + dokumentasi
  //         const totalFileSize = files
  //           .filter(
  //             (f) =>
  //               f.fieldname.startsWith(`regulasi[${i}]`) ||
  //               f.fieldname.startsWith(`dokumentasi[${i}]`)
  //           )
  //           .reduce((acc, curr) => acc + curr.size, 0);

  //         // Batasi total ukuran file untuk setiap inovasi 10MB
  //         if (totalFileSize > 10 * 1024 * 1024) {
  //           throw new Error(
  //             `Total ukuran file inovasi ke-${i + 1} melebihi 10MB`
  //           );
  //         }

  //         return {
  //           nama_inovasi: nama_inovasi[i],
  //           deskripsi_inovasi: deskripsi_inovasi[i],
  //           regulasi: JSON.stringify(regulasiFiles), // Simpan sebagai array JSON
  //           dokumentasi: JSON.stringify(dokumentasiFiles), // Simpan sebagai array JSON
  //           tahun: tahun[i],
  //           link_drive: link_drive[i] || null,
  //           user_id: user_id[i],
  //           kategori_id: kategori_id[i],
  //         };
  //       });

  //       // Insert data ke database
  //       const newUsulanSmart = await UsulanSmart.bulkCreate(dataToInsert, {
  //         transaction,
  //       });

  //       const trackingEntries = newUsulanSmart.map((usulan: any, i) => ({
  //         user_id: usulan.user_id,
  //         usulan_id: usulan.id,
  //         keterangan: `Menambahkan Data Inovasi ${nama_inovasi[i]}`,
  //       }));
  //       await Tracking.bulkCreate(trackingEntries, { transaction });

  //       // Ambil data kategori terlebih dahulu berdasarkan kategori_id yang ada di newUsulanSmart
  //       const kategoriIds = newUsulanSmart.map(
  //         (usulan: any) => usulan.kategori_id
  //       );
  //       const kategoris = await Kategori.findAll({
  //         where: {
  //           id: kategoriIds,
  //         },
  //         raw: true,
  //       });

  //       // Buat dictionary untuk memetakan kategori_id ke kategori_nama
  //       const kategoriMap = kategoris.reduce((map: any, kategori: any) => {
  //         map[kategori.id] = kategori.jenis_smart;
  //         return map;
  //       }, {});

  //       const notifikasiEntries = newUsulanSmart.map((usulan: any) => ({
  //         user_id: usulan.user_id,
  //         usulan_id: usulan.id,
  //         title: `${usulan.nama_inovasi}`,
  //         message: `Menambahkan Data Inovasi ${
  //           usulan.nama_inovasi
  //         } ke dalam Dimensi ${kategoriMap[usulan.kategori_id]}`,
  //       }));
  //       await Notifikasi.bulkCreate(notifikasiEntries, { transaction });

  //       await transaction.commit();

  //       io.emit("usulanAdded", newUsulanSmart);

  //       res.status(201).json({
  //         success: true,
  //         status: 201,
  //         message: "Data berhasil disimpan",
  //         result: newUsulanSmart,
  //       });
  //     } catch (error: any) {
  //       await LogError.create({
  //         jenis_akses: "backend",
  //         error_message: error.message,
  //         stack_trace: error.stack,
  //       });
  //       await transaction.rollback();
  //       return res.status(500).json({
  //         success: false,
  //         status: 500,
  //         message: error.message,
  //       });
  //     }
  //   });
  // },

  updateApieditUsulan: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    uploadTwo.any()(req, res, async function (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Batas ukuran tiap file adalah 10MB!",
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

      // Handle multiple file uploads and calculate total size
      const files = req.files as Express.Multer.File[];
      const totalFileSize = files.reduce((total, file) => total + file.size, 0);

      // Batasi total ukuran file yang diupload
      const maxTotalSize = 10 * 1024 * 1024; // 10 MB total
      if (totalFileSize > maxTotalSize) {
        // Hapus file yang sudah ter-upload jika total ukuran file melebihi batas
        files.forEach((file) => fsLink.unlinkSync(file.path));
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Total ukuran file yang diupload tidak boleh melebihi 10MB!",
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

        // Handle new file uploads or keep old files if no new ones uploaded
        const newDokumentasi = files
          .filter((file) => file.fieldname === "dokumentasi")
          .map((file) => file.filename);
        const newRegulasi = files
          .filter((file) => file.fieldname === "regulasi")
          .map((file) => file.filename);

        // Parse existing file data
        const oldDokumentasi = JSON.parse(existingUsulan.dokumentasi || "[]");
        const oldRegulasi = JSON.parse(existingUsulan.regulasi || "[]");

        // Logika untuk memeriksa dan menghapus file lama jika diganti
        const filesToRemove: any = {
          dokumentasi: oldDokumentasi.filter(
            (file: any) => !newDokumentasi.includes(file)
          ),
          regulasi: oldRegulasi.filter(
            (file: any) => !newRegulasi.includes(file)
          ),
        };

        // Hapus file yang sudah digantikan oleh file baru (jika ada)
        filesToRemove.dokumentasi.forEach((file: any) => {
          const filePath = path.join(
            __dirname,
            `../../public/usulan-smart/dokumentasi/${file}`
          );
          if (fsLink.existsSync(filePath)) {
            fsLink.unlinkSync(filePath); // Hapus file jika ada
          } else {
            console.log(`File dokumentasi tidak ditemukan: ${filePath}`);
          }
        });

        filesToRemove.regulasi.forEach((file: any) => {
          const filePath = path.join(
            __dirname,
            `../../public/usulan-smart/berkas/${file}`
          );
          if (fsLink.existsSync(filePath)) {
            fsLink.unlinkSync(filePath); // Hapus file jika ada
          } else {
            console.log(`File regulasi tidak ditemukan: ${filePath}`);
          }
        });

        // Jika ada file baru, gunakan yang baru, jika tidak, simpan yang lama
        const updatedDokumentasi = newDokumentasi.length
          ? JSON.stringify([
              ...oldDokumentasi.filter(
                (f: any) => !filesToRemove.dokumentasi.includes(f)
              ),
              ...newDokumentasi,
            ])
          : JSON.stringify(oldDokumentasi);
        const updatedRegulasi = newRegulasi.length
          ? JSON.stringify([
              ...oldRegulasi.filter(
                (f: any) => !filesToRemove.regulasi.includes(f)
              ),
              ...newRegulasi,
            ])
          : JSON.stringify(oldRegulasi);

        // Update the record with new or existing data
        await existingUsulan.update(
          {
            nama_inovasi,
            deskripsi_inovasi,
            tahun,
            user_id,
            kategori_id,
            link_drive,
            dokumentasi: updatedDokumentasi,
            regulasi: updatedRegulasi,
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

  //   updateApieditUsulan: async (
  //     req: Request,
  //     res: Response,
  //     next: NextFunction
  //   ) => {
  //     uploadTwo.any()(req, res, async function (err) {
  //       if (err instanceof multer.MulterError) {
  //         if (err.code === "LIMIT_FILE_SIZE") {
  //           return res.status(400).json({
  //             success: false,
  //             status: 400,
  //             message: {
  //               error: "Batas ukuran tiap file adalah 10MB!",
  //             },
  //           });
  //         } else {
  //           return res.status(400).json({
  //             success: false,
  //             status: 400,
  //             message: {
  //               error: err.message,
  //             },
  //           });
  //         }
  //       } else if (err) {
  //         return res.status(400).json({
  //           success: false,
  //           status: 400,
  //           message: {
  //             error: err.message,
  //           },
  //         });
  //       }

  //       // Handle multiple file uploads and calculate total size
  //       const files = req.files as Express.Multer.File[];
  //       const totalFileSize = files.reduce((total, file) => total + file.size, 0);

  //       // Batasi total ukuran file yang diupload
  //       const maxTotalSize = 10 * 1024 * 1024; // 10 MB total
  //       if (totalFileSize > maxTotalSize) {
  //         // Hapus file yang sudah ter-upload jika total ukuran file melebihi batas
  //         files.forEach((file) => fsLink.unlinkSync(file.path));
  //         return res.status(400).json({
  //           success: false,
  //           status: 400,
  //           message: {
  //             error: "Total ukuran file yang diupload tidak boleh melebihi 10MB!",
  //           },
  //         });
  //       }

  //       const transaction = await sequelize.transaction();
  //       const usulanId = req.params.id;

  //       try {
  //         const {
  //           nama_inovasi,
  //           deskripsi_inovasi,
  //           tahun,
  //           user_id,
  //           kategori_id,
  //           link_drive,
  //         } = req.body;

  //         const existingUsulan: any = await UsulanSmart.findByPk(usulanId);

  //         if (!existingUsulan) {
  //           return res.status(404).json({
  //             success: false,
  //             status: 404,
  //             message: {
  //               error: "Usulan tidak ditemukan",
  //             },
  //           });
  //         }

  //         // Handle new file uploads or keep old files if no new ones uploaded
  //         const newDokumentasi = files
  //           .filter((file) => file.fieldname === "dokumentasi")
  //           .map((file) => file.filename);
  //         const newRegulasi = files
  //           .filter((file) => file.fieldname === "regulasi")
  //           .map((file) => file.filename);

  //         // Parse existing file data
  //         const oldDokumentasi = JSON.parse(existingUsulan.dokumentasi || "[]");
  //         const oldRegulasi = JSON.parse(existingUsulan.regulasi || "[]");

  //         // Logika untuk memeriksa dan menghapus file lama jika diganti
  //         const filesToRemove: any = {
  //           dokumentasi: oldDokumentasi.filter(
  //             (file: any) => !newDokumentasi.includes(file)
  //           ),
  //           regulasi: oldRegulasi.filter(
  //             (file: any) => !newRegulasi.includes(file)
  //           ),
  //         };

  //         // Hapus file yang sudah digantikan oleh file baru
  //         filesToRemove.dokumentasi.forEach((file: any) => {
  //           fsLink.unlinkSync(
  //             path.join(
  //               __dirname,
  //               `../../public/usulan-smart/dokumentasi/${file}`
  //             )
  //           );
  //         });

  //         filesToRemove.regulasi.forEach((file: any) => {
  //           fsLink.unlinkSync(
  //             path.join(__dirname, `../../public/usulan-smart/berkas/${file}`)
  //           );
  //         });

  //         // If new files exist, use them, otherwise keep old files
  //         const updatedDokumentasi = newDokumentasi.length
  //           ? JSON.stringify(newDokumentasi)
  //           : JSON.stringify(oldDokumentasi); // If no new files, keep old ones
  //         const updatedRegulasi = newRegulasi.length
  //           ? JSON.stringify(newRegulasi)
  //           : JSON.stringify(oldRegulasi);

  //         // Update the record with new or existing data
  //         await existingUsulan.update(
  //           {
  //             nama_inovasi,
  //             deskripsi_inovasi,
  //             tahun,
  //             user_id,
  //             kategori_id,
  //             link_drive,
  //             dokumentasi: updatedDokumentasi,
  //             regulasi: updatedRegulasi,
  //           },
  //           { transaction }
  //         );

  //         // Log tracking data
  //         await Tracking.create(
  //           {
  //             user_id: existingUsulan.user_id,
  //             usulan_id: existingUsulan.id,
  //             keterangan: "Mengupdate Data Inovasi " + nama_inovasi,
  //           },
  //           { transaction }
  //         );

  //         await transaction.commit();
  //         io.emit("usulanUpdated", existingUsulan);

  //         res.status(201).json({
  //           success: true,
  //           status: 201,
  //           message: "Data berhasil diupdate",
  //           result: existingUsulan,
  //         });
  //       } catch (error: any) {
  //         await LogError.create({
  //           jenis_akses: "backend",
  //           error_message: error.message,
  //           stack_trace: error.stack,
  //         });
  //         await transaction.rollback();
  //         return res.status(500).json({
  //           success: false,
  //           status: 500,
  //           message: error,
  //         });
  //       }
  //     });
  //   },
};
export default inovasiSmartController;
