import { Request, Response } from "express";
import { models, sequelize } from "../../database/models";
const { KlasifikasiSurvei } = models;
const { Op } = require("sequelize");

const KlasifikasiSurveiController = {
  getAllKlasifikasiSurvei: async (req: Request, res: Response) => {
    let limit = 10;
    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await KlasifikasiSurvei.findAndCountAll({
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });

      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      if (rows.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data Klasifikasi Survei Tidak Ditemukan",
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
      const getKlasifikasiSurvei = await KlasifikasiSurvei.findAll({
        where: {
          jenis_survei: {
            [Op.like]: `%${searchTerm}%`,
          },
        },
      });

      if (getKlasifikasiSurvei.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Klasifikasi Tidak Ditemukan",
          },
        });
      }

      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: getKlasifikasiSurvei,
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

  getById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const getKlasifikasiById = await KlasifikasiSurvei.findOne({
        where: { id },
      });

      if (!getKlasifikasiById) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Klasifikasi Tidak Ditemukan",
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

  createKlasifikasiSurvei: async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
      const { jenis_survei } = req.body;

      if (!jenis_survei) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Jenis Survei Tidak Boleh Kosong!",
          },
        });
      }

      const storeOpd = await KlasifikasiSurvei.create({ jenis_survei });

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

  updateKlasifikasiSurvei: async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      console.log(id);
      const { jenis_survei } = req.body;

      if (!jenis_survei) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Jenis Survei Tidak Boleh Kosong!",
          },
        });
      }

      const getDataOpdInUpdate = await KlasifikasiSurvei.findByPk(id);

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
        jenis_survei,
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

export default KlasifikasiSurveiController;
