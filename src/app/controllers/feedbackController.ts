import { Request, Response, NextFunction } from "express";
import { models, sequelize } from "../../database/models";
import { User } from "../../database/models/user";
const { FeedBack, Opd } = models;
const { Op } = require("sequelize");
import { io } from "../../app";

const FeedBackController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }

    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await FeedBack.findAndCountAll({
        limit,
        offset,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["nama_lengkap", "email", "no_hp"],
            include: [
              {
                model: Opd,
                as: "opd",
              },
            ],
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

  searchDataFeedBack: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const searchTerm = req.query.search;

    try {
      const feedbacks = await FeedBack.findAll({
        include: [
          {
            model: User,
            as: "user",
            attributes: ["nama_lengkap", "email", "no_hp"],
            include: [
              {
                model: Opd,
                as: "opd",
                attributes: ["id", "nama_opd"],
              },
            ],
          },
        ],
        where: {
          [Op.or]: [
            { bintang: { [Op.like]: `%${searchTerm}%` } }, // Ubah sesuai dengan nama kolom yang sesuai
            { kritik: { [Op.like]: `%${searchTerm}%` } }, // Ubah sesuai dengan nama kolom yang sesuai
          ],
        },
      });

      const foundFeedback = feedbacks.find(
        (feedback: any) => feedback.user === null
      );

      if (foundFeedback) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Data tidak ditemukan",
        });
      }
      res.status(200).json({
        success: true,
        status: 200,
        message: "Data ditemukan",
        result: feedbacks,
      });
    } catch (error: any) {
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

      const getFeedBackById = await FeedBack.findOne({
        where: { id },
        include: [
          {
            model: User,
            as: "user",
            attributes: ["nama_lengkap", "email", "no_hp"],
            include: [
              {
                model: Opd,
                as: "opd",
              },
            ],
          },
        ],
      });

      if (!getFeedBackById) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Feedback Tidak Ditemukan",
          },
        });
      }

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: getFeedBackById,
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

  createFeedBack: async (req: Request, res: Response, next: NextFunction) => {
    const transaction = await sequelize.transaction();

    try {
      const { user_id, bintang, kritik, saran } = req.body;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "User ID Tidak Boleh Kosong!",
          },
        });
      }
      if (!bintang) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Rating Tidak Boleh Kosong!",
          },
        });
      }
      if (!kritik) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Kritik Tidak Boleh Kosong!",
          },
        });
      }
      if (!saran) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "saran Tidak Boleh Kosong!",
          },
        });
      }

      const storeFeedBack = await FeedBack.create({
        user_id,
        bintang,
        kritik,
        saran,
      });
      const user = await User.findByPk(user_id);

      if (user && !user.is_feedback) {
        user.is_feedback = true;
        await user.save({ transaction });
      }

      await transaction.commit();
      io.emit("feedBackAdded", storeFeedBack);

      return res.status(201).json({
        success: true,
        status: 201,
        message: "Data Berhasil Di Tambah",
        result: storeFeedBack,
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

  editFeedback: async (req: Request, res: Response, next: NextFunction) => {
    const transaction = await sequelize.transaction();

    try {
      const { user_id, bintang, kritik, saran } = req.body;
      const { id } = req.params;

      if (!user_id) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "User ID Tidak Boleh Kosong!",
          },
        });
      }
      if (!bintang) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Rating Tidak Boleh Kosong!",
          },
        });
      }
      if (!kritik) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Kritik Tidak Boleh Kosong!",
          },
        });
      }
      if (!saran) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "saran Tidak Boleh Kosong!",
          },
        });
      }

      const getDataFeedBackInUpdate = await FeedBack.findByPk(id);

      if (!getDataFeedBackInUpdate) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Tersebut Tidak Ada",
          },
        });
      }

      await getDataFeedBackInUpdate.update({ user_id, bintang, kritik, saran });
      await transaction.commit();
      io.emit("feedBackEdited", getDataFeedBackInUpdate);

      return res.status(200).json({
        status: true,
        message: "Data Berhasil Di Update",
        result: getDataFeedBackInUpdate,
        invalidateCache: true,
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
  },

  deleteOpd: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const getDataById = await FeedBack.findByPk(id);

      if (!getDataById) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Tersebut Tidak Ada",
          },
        });
      }

      await getDataById.destroy();

      io.emit("feedBackDeleted", id);

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Berhasil Di Hapus",
        invalidateCache: true,
      });
    } catch (error) {
      console.error("Error in deleteOpd:", error);
      res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: "Internal Server Error",
        },
      });
    }
  },
};

export default FeedBackController;
