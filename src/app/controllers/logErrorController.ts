import { Request, Response, NextFunction } from "express";
import { models } from "../../database/models";
const { LogError } = models;
const { Op } = require("sequelize");

const LogErrorController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }

    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await LogError.findAndCountAll({
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
          message: {
            error: "Data Feedback Tidak Ditemukan",
          },
        });
      }
      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: rows,
        page: page,
        total_pages: totalPages,
        total_data: totalData,
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
  checkDeploy: async (req: Request, res: Response, next: NextFunction) => {
   
    try {
      res.status(200).json({
        success: true,
        status: 200,
        message: "Deploy Berhasil Lokal Testing Ditemukan",
      });
    } catch (error: any) {
      
    }
  },
  pushError: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { jenis_akses, error_message, stack_trace } = req.body;
      if (!jenis_akses) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Jenis akses is required",
          },
        });
      }
      if (!error_message) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Error akses is required",
          },
        });
      }
      await LogError.create({
        jenis_akses,
        error_message,
        stack_trace,
      });
      res.status(200).json({
        success: true,
        status: 200,
        message: "Log Berhasil Ditambah",
      });
    } catch (error: any) {
      try {
        await LogError.create({
          jenis_akses: "backend",
          error_message: error.message,
          stack_trace: error.stack,
        });
      } catch (logError) {
        console.error("Failed to log error:", logError);
      }

      let errorMessage = error.message;
      if (!errorMessage) {
        errorMessage = "Internal Server Error";
      }

      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: errorMessage,
        },
      });
    }
  },
  search: async (req: Request, res: Response, next: NextFunction) => {
    const searchTerm = req.query.search;

    try {
      const opd = await LogError.findAll({
        where: {
          jenis_akses: {
            [Op.like]: `%${searchTerm}%`,
          },
        },
      });

      if (opd.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Log Error Tidak Ditemukan",
          },
        });
      }

      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: opd,
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
};

export default LogErrorController;
