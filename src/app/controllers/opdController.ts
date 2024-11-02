import { Request, Response, NextFunction } from "express";
import { models, sequelize } from "../../database/models";
import { User } from "../../database/models/user";
const { Opd, UsulanSmart } = models;
const { Op } = require("sequelize");
import { io } from "../../app";
import axios from "axios";
import * as XLSX from "xlsx";

const OpdController = {
  retryRequest: async (requestData: any, retryLimit: number = 3) => {
    let retries = 0;
    while (retries < retryLimit) {
      try {
        const response = await axios(requestData);
        return response;
      } catch (error: any) {
        console.error(`Retry request ${retries + 1}: ${error.message}`);
        retries++;
      }
    }
    throw new Error("Exceeded retry limit");
  },

  getAll: async (req: Request, res: Response, next: NextFunction) => {
    let limit = 10;

    if (req.query.limit) {
      limit = parseInt(req.query.limit as string);
    }

    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await Opd.findAndCountAll({
        limit,
        offset,
        order: [["nama_opd", "ASC"]],
      });

      const totalPages = Math.ceil(count / limit);
      const totalData = count;

      if (rows.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data Opd Tidak Ditemukan",
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

  search: async (req: Request, res: Response, next: NextFunction) => {
    const searchTerm = req.query.search;

    try {
      const opd = await Opd.findAll({
        where: {
          nama_opd: {
            [Op.like]: `%${searchTerm}%`,
          },
        },
      });

      if (opd.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Opd Tidak Ditemukan",
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

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const getOpdById = await Opd.findOne({
        where: { id },
      });

      if (!getOpdById) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data Opd Tidak Ditemukan",
          },
        });
      }

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: getOpdById,
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

  createOpd: async (req: Request, res: Response, next: NextFunction) => {
    const transaction = await sequelize.transaction();

    try {
      const { nama_opd } = req.body;

      if (!nama_opd) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Nama Opd Tidak Boleh Kosong!",
          },
        });
      }

      const storeOpd = await Opd.create({ nama_opd });

      await transaction.commit();

      io.emit("opdAdded", storeOpd);

      return res.status(201).json({
        success: true,
        status: 201,
        message: "Data Berhasil Di Tambah",
        result: storeOpd,
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

  editOpd: async (req: Request, res: Response, next: NextFunction) => {
    const transaction = await sequelize.transaction();
    try {
      const { nama_opd } = req.body;
      const { id } = req.params;

      if (!nama_opd) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Nama Opd Tidak Boleh Kosong!",
          },
        });
      }

      const getDataOpdInUpdate = await Opd.findByPk(id);

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
        nama_opd,
      });

      await transaction.commit();

      io.emit("opdEdited", getDataOpdInUpdate);

      return res.status(200).json({
        status: true,
        message: "Data Berhasil Di Update",
        result: getDataOpdInUpdate,
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

  deleteOpd: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      console.log(`Attempting to delete OPD with id: ${id}`);

      const users = (await User.findAll({ where: { opd_id: id } })) as User[];

      for (const user of users) {
        await UsulanSmart.destroy({ where: { user_id: user.id } });

        await user.destroy();
      }

      const getDataById = await Opd.findByPk(id);

      if (!getDataById) {
        console.log(`OPD with id: ${id} not found`);
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Tersebut Tidak Ada",
          },
        });
      }

      await getDataById.destroy();

      console.log(`OPD with id: ${id} successfully deleted`);
      io.emit("opdDeleted", id);

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

  exportToexcel: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const getAllOpd: any = await Opd.findAll({
        order: [["nama_opd", "ASC"]],
      });

      if (getAllOpd.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: "Data Opd Tidak Ditemukan",
        });
      }

      const workbook = XLSX.utils.book_new();
      const worksheetData = getAllOpd.map((row: any) => ({
        nama_opd: row.nama_opd, // Sesuaikan dengan nama kolom di database
        opd_id: row.id,
        // tambahkan kolom lain jika diperlukan
      }));
      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data OPD");

      // Mengirim file Excel sebagai respons
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="data_opd.xlsx"'
      );
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "buffer",
      });
      return res.send(excelBuffer);
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: error,
      });
    }
  },
};

export default OpdController;
