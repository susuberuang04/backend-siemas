import { Request, Response, NextFunction } from "express";
import { models } from "../../database/models";
const { Tracking, UsulanSmart, User, LogError } = models;

const TrackingController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }

    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await Tracking.findAndCountAll({
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
          message: "Data Tracking Tidak Ditemukan",
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
  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const getOpdById = await Tracking.findOne({
        where: { id },
      });

      if (!getOpdById) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Tracking Tidak Ditemukan",
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
  getByAllUserId: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user_id } = req.params;

      const getOpdById = await Tracking.findAll({
        where: {
          user_id: user_id,
        },
      });

      if (getOpdById.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Tracking Tidak Ditemukan",
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
  getByAllUsulanId: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { usulan_id } = req.params;

      const getOpdById = await Tracking.findAll({
        where: {
          usulan_id: usulan_id,
        },
      });

      if (getOpdById.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Tracking Tidak Ditemukan",
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
  getByAllUsulanIdAndUserId: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { usulan_id, user_id } = req.params;

      const getOpdById = await Tracking.findAll({
        where: {
          usulan_id: usulan_id,
          user_id: user_id,
        },
      });

      if (getOpdById.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Tracking Tidak Ditemukan",
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
};

export default TrackingController;
