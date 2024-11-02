import { Request, Response } from "express";
import { models, sequelize } from "../../database/models";
const { JawabanPertanyaanSurvei, PertanyaanSurvei } = models;
const { Op } = require("sequelize");

const JawabanPertanyaanSurveiController = {
  getAllJawabanPertanyaanSurvei: async (req: Request, res: Response) => {
    let limit = 10;
    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await JawabanPertanyaanSurvei.findAndCountAll({
        limit,
        offset,
        include: [
          {
            model: PertanyaanSurvei,
            as: "PertanyaanSurvei",
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      if (rows.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data Jawaban Pertanyaan Survei Tidak Ditemukan",
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
      const getKlasifikasiSurvei = await JawabanPertanyaanSurvei.findAll({
        where: {
          [Op.or]: [
            { jawaban_pertanyaan: { [Op.like]: `%${searchTerm}%` } },
            {
              "$PertanyaanSurvei.pertanyaan$": {
                [Op.like]: `%${searchTerm}%`,
              },
            },
          ],
        },
        include: [
          {
            model: PertanyaanSurvei,
            as: "PertanyaanSurvei",
            required: false,
          },
        ],
      });

      if (getKlasifikasiSurvei.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Pertanyaan Survei Tidak Ditemukan",
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

      const getKlasifikasiById = await JawabanPertanyaanSurvei.findOne({
        where: { id },
        include: [
          {
            model: PertanyaanSurvei,
            as: "PertanyaanSurvei",
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

  createJawabanPertanyaanSurvei: async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
      const { pertanyaan_id, jawaban_pertanyaan } = req.body;

      if (!pertanyaan_id) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Pertanyaan Survei Tidak Boleh Kosong!",
          },
        });
      }
      if (!jawaban_pertanyaan) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Jawaban Pertanyaan Survei Tidak Boleh Kosong!",
          },
        });
      }

      const storeOpd = await JawabanPertanyaanSurvei.create({
        pertanyaan_id,
        jawaban_pertanyaan,
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

  updateJawabanPertanyaanSurvei: async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();

    try {
      const { id } = req.params;
      const { pertanyaan_id, jawaban_pertanyaan } = req.body;

      if (!pertanyaan_id || !jawaban_pertanyaan) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Harus Di Isi Tidak Boleh Kosong!",
          },
        });
      }

      const getDataOpdInUpdate = await JawabanPertanyaanSurvei.findByPk(id);

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
        pertanyaan_id,
        jawaban_pertanyaan,
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

export default JawabanPertanyaanSurveiController;
