import { Request, Response, NextFunction } from "express";
import { models, sequelize } from "../../database/models";
const { HistoryPenghapusan } = models;
const { Op } = require("sequelize");

const HistoryPenghapusanController = {
  getAllHistoryPenghapusan: async (
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

    try {
      const { count, rows } = await HistoryPenghapusan.findAndCountAll({
        limit,
        offset,
        where: {
          status: {
            [Op.in]: ["Hapus Permanen", "Hapus Sementara"],
          },
        },
        order: [["createdAt", "DESC"]],
      });

      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      if (rows.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data History Penghapusan Tidak Ditemukan",
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
      return res.status(500).json({
        success: false,
        status: 500,
        message: error,
      });
    }
  },
  searchHistoryPenghapusan: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const searchTerm = req.query.search;
    try {
      const searchPenghapusan = await HistoryPenghapusan.findAll({
        where: {
          status: {
            [Op.in]: ["Hapus Permanen", "Hapus Sementara"],
          },
          nama_tabel: {
            [Op.like]: `%${searchTerm}%`,
          },
        },
      });

      if (searchPenghapusan.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data History Penghapusan Tidak Ditemukan",
        });
      }

      const response = {
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: searchPenghapusan,
      };

      res.status(200).json(response);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: error,
      });
    }
  },
  getAllHistoryPemulihan: async (
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

    try {
      const { count, rows } = await HistoryPenghapusan.findAndCountAll({
        limit,
        offset,
        where: {
          status: "Dipulihkan",
        },
        order: [["createdAt", "DESC"]],
      });

      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      if (rows.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data History Pemulihan Tidak Ditemukan",
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
      return res.status(500).json({
        success: false,
        status: 500,
        message: error,
      });
    }
  },
  searchHistoryrRestore: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const searchTerm = req.query.search;
    try {
      const searchPenghapusan = await HistoryPenghapusan.findAll({
        where: {
          status: "Dipulihkan",
          nama_tabel: {
            [Op.like]: `%${searchTerm}%`,
          },
        },
      });

      if (searchPenghapusan.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data History Pemulihan Tidak Ditemukan",
        });
      }

      const response = {
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: searchPenghapusan,
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({
        success: false,
        status: 500,
        message: error,
      });
    }
  },
};

export default HistoryPenghapusanController;
