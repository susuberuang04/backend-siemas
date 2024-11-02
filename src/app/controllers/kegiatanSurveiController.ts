import { Request, Response } from "express";
import { models, sequelize } from "../../database/models";
const { KegiatanSurvei, KlasifikasiSurvei } = models;
const { Op } = require("sequelize");

const KegiatanSurveiController = {
  getAllKegiatanSurvei: async (req: Request, res: Response) => {
    let limit = 10;
    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await KegiatanSurvei.findAndCountAll({
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: KlasifikasiSurvei,
            as: "KlasifikasiSurvei",
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      if (rows.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data Kegiatan Survei Tidak Ditemukan",
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
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        status: 500,
        message: error,
      });
    }
  },

  search: async (req: Request, res: Response) => {
    const searchTerm = req.query.search?.toString().trim();

    try {
      const getKlasifikasiSurvei = await KegiatanSurvei.findAll({
        where: {
          [Op.or]: [
            { nama_kegiatan: { [Op.like]: `%${searchTerm}%` } },
            {
              "$KlasifikasiSurvei.jenis_survei$": {
                [Op.like]: `%${searchTerm}%`,
              },
            },
          ],
        },
        include: [
          {
            model: KlasifikasiSurvei,
            as: "KlasifikasiSurvei",
            required: false, // Tetapkan false agar data tetap muncul meskipun tidak ada kecocokan di KlasifikasiSurvei
          },
        ],
      });

      if (getKlasifikasiSurvei.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Kegiatan Survei Tidak Ditemukan",
          },
        });
      }

      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: getKlasifikasiSurvei,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message || "Terjadi kesalahan pada server",
        },
      });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const getKlasifikasiById = await KegiatanSurvei.findOne({
        where: { id },
        include: [
          {
            model: KlasifikasiSurvei,
            as: "KlasifikasiSurvei",
          },
        ],
      });

      if (!getKlasifikasiById) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Kegiatan Survei Tidak Ditemukan",
          },
        });
      }

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: getKlasifikasiById,
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

  createKegiatanSurvei: async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
      const { klasifikasi_id, nama_kegiatan } = req.body;

      if (!klasifikasi_id) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Jenis Survei Tidak Boleh Kosong!",
          },
        });
      }
      if (!nama_kegiatan) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Nama Kegiatan Tidak Boleh Kosong!",
          },
        });
      }

      const storeOpd = await KegiatanSurvei.create({
        klasifikasi_id,
        nama_kegiatan,
      });

      await transaction.commit();

      return res.status(201).json({
        success: true,
        status: 201,
        message: "Data Berhasil Di Tambah",
        result: storeOpd,
      });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },

  updateKegiatanSurvei: async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { klasifikasi_id, nama_kegiatan } = req.body;

      if (!klasifikasi_id || !nama_kegiatan) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Harus Di Isi Tidak Boleh Kosong!",
          },
        });
      }

      const getDataOpdInUpdate = await KegiatanSurvei.findByPk(id);

      if (!getDataOpdInUpdate) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Tersebut Tidak Ada",
          },
        });
      }

      await getDataOpdInUpdate.update({
        klasifikasi_id,
        nama_kegiatan,
      });

      await transaction.commit();

      return res.status(200).json({
        status: true,
        message: "Data Berhasil Di Update",
        result: getDataOpdInUpdate,
      });
    } catch (error) {
      await transaction.rollback();
      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },
};

export default KegiatanSurveiController;
