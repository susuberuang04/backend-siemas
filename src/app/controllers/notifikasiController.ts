import { Request, Response, NextFunction } from "express";
import { models, sequelize } from "../../database/models";
const { Notifikasi } = models;
const NotifikasiController = {
  getAllNotifikasiBySuperadmin: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const response = await Notifikasi.findAll();
      if (response.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data Notifikasi Tidak Ditemukan",
        });
      }
      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: response,
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
  getNotifikasiById: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { user_id } = req.params; // Ambil id dan user_id dari params
      const response = await Notifikasi.findOne({
        where: {
          user_id: user_id, // Filter berdasarkan user_id
        },
      });

      if (!response) {
        return res.status(404).json({
          success: false, // Ubah ke false karena data tidak ditemukan
          status: 404,
          message: "Data Notifikasi Tidak Ditemukan",
        });
      }

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: response,
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
  createNotifikasi: async (req: Request, res: Response, next: NextFunction) => {
    const transaction = await sequelize.transaction();

    try {
      const { user_id, token } = req.body;
      if (!token) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Token Tidak Boleh Kosong!",
          },
        });
      }
      const storeNotifikasi = await Notifikasi.create({ user_id, token });

      await transaction.commit();

      return res.status(201).json({
        success: true,
        status: 201,
        message: "Data Berhasil Di Tambah",
        result: storeNotifikasi,
        invalidateCache: true,
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

export default NotifikasiController;
