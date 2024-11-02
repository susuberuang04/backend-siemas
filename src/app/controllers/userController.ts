import { Request, Response, NextFunction } from "express";
import { models } from "../../database/models";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { io } from "../../app";
const nodemailer = require("nodemailer");
const { User, Opd, UsulanSmart } = models;
import path from "path";
import { getResetPasswordTemplate } from "../../utils/template";
const { Op } = require("sequelize");
require("dotenv").config();

const JWT_SECRET =
  process.env.JWT_SECRET || "kominadoadopjwaoejoq3eq23eo$$awediaemkada";
const UserController = {
  loginUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, password } = req.body;

      if (!username && !password) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Harap Semuanya Disini Tidak Boleh Kosong",
          },
        });
      }

      if (!username) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Username Tidak  Boleh Kosong",
          },
        });
      }

      if (!password) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Password Tidak  Boleh Kosong",
          },
        });
      }

      const checkedUserValid = await User.findOne({ where: { username } });

      if (!checkedUserValid) {
        return res.status(401).json({
          success: false,
          status: 401,
          message: {
            error: "Username Tidak Ditemukan",
          },
        });
      }

      const user = checkedUserValid.get({ plain: true });

      if (user.status === "banned") {
        return res.status(401).json({
          success: false,
          status: 401,
          message: {
            error: "Akun Anda Kena Banned. Silakan hubungi admin.",
          },
        });
      }

      if (user.status === "tidak aktif") {
        return res.status(401).json({
          success: false,
          status: 401,
          message: {
            error: "Akun Anda tidak aktif. Harap hubungi admin segera.",
          },
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(403).json({
          success: false,
          message: {
            error: "Password Salah",
          },
        });
      }

      const token = jwt.sign(
        {
          userId: user.id,
          nama_lengkap: user.nama_lengkap,
          username: user.username,
          email: user.email,
          no_hp: user.no_hp,
          role: user.role,
          opd_id: user.opd_id,
          fedback: user.is_feedback,
          konfirmasi: user.is_confirm,
        },
        JWT_SECRET
      );

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Login Berhasil",
        result: {
          userId: user.id,
          nama_lengkap: user.nama_lengkap,
          username: user.username,
          email: user.email,
          no_hp: user.no_hp,
          token,
          role: user.role,
          opd_id: user.opd_id,
          fedback: user.is_feedback,
          konfirmasi: user.is_confirm,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },

  getAllUsers: async (req: Request, res: Response, next: NextFunction) => {
    const limit = 10;

    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await User.findAndCountAll({
        limit,
        offset,
        attributes: {
          exclude: ["password"],
        },
        include: [
          {
            model: Opd,
            as: "opd",
            attributes: ["nama_opd"],
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
            error: "Data User Tidak Ditemukan",
          },
        });
      }

      res.status(200).json({
        success: true,
        status: 200,
        lol: "lol",
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
  //update deploy
  getAllUsersByOpdId: async (req: Request, res: Response, next: NextFunction) => {
    const limit = 10;
    const { opd_id } = req.params;

    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await User.findAndCountAll({
        limit,
        offset,
        where: {
          opd_id: opd_id,
        },
        attributes: {
          exclude: ["password"],
        },
        include: [
          {
            model: Opd,
            as: "opd",
            attributes: ["nama_opd"],
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
            error: "Data User Tidak Ditemukan",
          },
        });
      }

      res.status(200).json({
        success: true,
        status: 200,
        lol: "lol",
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

  getUserById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const getUserById = await User.findOne({
        where: { id },
        attributes: {
          exclude: ["password"],
        },
        include: [
          {
            model: Opd,
            as: "opd",
            attributes: ["nama_opd"],
          },
        ],
      });

      if (!getUserById) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data User Tidak Ditemukan",
          },
        });
      }

      return res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: getUserById,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },

  search: async (req: Request, res: Response, next: NextFunction) => {
    const searchTerm = req.query.search;

    try {
      const getSearch = await User.findAll({
        where: {
          [Op.or]: [
            {
              nama_lengkap: {
                [Op.like]: `%${searchTerm}%`,
              },
            },
            {
              "$opd.nama_opd$": {
                [Op.like]: `%${searchTerm}%`,
              },
            },
          ],
        },
        include: [
          {
            model: Opd,
            as: "opd",
            attributes: ["nama_opd"],
          },
        ],
      });

      if (getSearch.length === 0) {
        return res.status(404).json({
          success: true,
          status: 404,
          message: {
            error: "Data User Tidak Ditemukan",
          },
        });
      }

      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: getSearch,
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

  tambahUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nama_lengkap, username, password, role, email, opd_id } =
        req.body;

      if (!nama_lengkap && !username && !password && !role && !opd_id) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Harap Semuanya Disini Tidak Boleh Kosong",
          },
        });
      }

      if (!nama_lengkap) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Nama Lengkap Tidak Boleh Kosong!",
          },
        });
      }

      if (!username) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Username Tidak Boleh Kosong!",
          },
        });
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error:
              "Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus!",
          },
        });
      }

      if (!role) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Hak Akses Tidak Boleh Kosong!",
          },
        });
      }

      const checkedUser = await User.findOne({ where: { username } });
      if (checkedUser) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Username Sudah Terdaftar",
          },
        });
      }

      if (role === "superadmin") {
        const existingSuperadmin = await User.findOne({
          where: { role: "superadmin" },
        });
        if (existingSuperadmin) {
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error:
                "Tidak bisa menambah 2 hak akses superadmin, superadmin sudah ada!!",
            },
          });
        }
      }

      if (role === "sekda") {
        const existingSekda = await User.findOne({
          where: { role: "sekda" },
        });
        if (existingSekda) {
          return res.status(400).json({
            success: false,
            status: 400,
            message: {
              error: "Hak akses Sekda karena akun sekda sudah ada!!",
            },
          });
        }
      }

      const hashedPassword = await bcrypt.hash(password, 11);

      const newUser = await User.create({
        nama_lengkap,
        username,
        password: hashedPassword,
        role,
        email,
        opd_id,
      });

      io.emit("userAdded", newUser);

      return res.status(201).json({
        success: true,
        status: 201,
        message: "Data Berhasil Ditambahkan",
        result: newUser,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },

  editUsers: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        nama_lengkap,
        username,
        password,
        role,
        email,
        no_hp,
        status,
        opd_id,
        loginId,
      } = req.body;

      const { id } = req.params;

      const getDataUserInUpdate = await User.findByPk(id);

      if (!getDataUserInUpdate) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Tersebut Tidak Ada",
          },
        });
      }

      if (!nama_lengkap && !username  && !role && !opd_id) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Harap Semuanya Disini Tidak Boleh Kosong",
          },
        });
      }

      if (!nama_lengkap) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Nama Lengkap Tidak Boleh Kosong!",
          },
        });
      }

      if (!username) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Username Tidak Boleh Kosong!",
          },
        });
      }

      // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      // if (!passwordRegex.test(password)) {
      //   return res.status(400).json({
      //     success: false,
      //     status: 400,
      //     message: {
      //       error:
      //         "Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus!",
      //     },
      //   });
      // }

      if (!role) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Hak Akses Tidak Boleh Kosong!",
          },
        });
      }

      if (!opd_id) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Opd Tidak Boleh Kosong!",
          },
        });
      }
      

      const checkedUser = await User.findOne({
        where: {
          id: {
            [Op.ne]: loginId,
          },
          username: username,
        },
      });

      if (checkedUser) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Username Sudah Terdaftar",
          },
        });
      }
      if (password) {
      
        const hashedPassword = await bcrypt.hash(password, 11);
        await getDataUserInUpdate.update({
          nama_lengkap,
          username,
          password: hashedPassword,
          role,
          email,
          opd_id,
          no_hp,
          status,
        });
      }else{
        await getDataUserInUpdate.update({
          nama_lengkap,
          username,
          role,
          email,
          opd_id,
          no_hp,
          status,
        });
        
      }


      io.emit("userEdited", getDataUserInUpdate);

      return res.status(201).json({
        success: true,
        status: 201,
        message: "Data Berhasil Di Update",
        result: getDataUserInUpdate,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },

  editUserInAccount: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { nama_lengkap, username, password, email, no_hp, loginId } =
        req.body;

      const { id } = req.params;

      const getDataUserInUpdate: any = await User.findByPk(id);

      if (!getDataUserInUpdate) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data Tersebut Tidak Ada",
          },
        });
      }

      if (!username && !password) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Harap Semuanya Disini Tidak Boleh Kosong",
          },
        });
      }

      if (!username) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Username Tidak Boleh Kosong!",
          },
        });
      }

      // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      // if (!passwordRegex.test(password)) {
      //   return res.status(400).json({
      //     success: false,
      //     status: 400,
      //     message: {
      //       error:
      //         "Password harus minimal 8 karakter, mengandung huruf besar, huruf kecil, angka, dan karakter khusus!",
      //     },
      //   });
      // }
      const checkedUser = await User.findOne({
        where: {
          id: {
            [Op.ne]: loginId,
          },
          username: username,
        },
      });

      if (checkedUser) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Username Sudah Terdaftar",
          },
        });
      }

      const hashedPassword = await bcrypt.hash(password, 11);
      
      if (!getDataUserInUpdate.is_confirm) {
        await getDataUserInUpdate.update({
          nama_lengkap,
          username,
          password: hashedPassword,
          email,
          no_hp,
          is_confirm: true,
        });
      } else {
        await getDataUserInUpdate.update({
          nama_lengkap,
          username,
          password: hashedPassword,
          email,
          no_hp,
        });
      }

      const token = jwt.sign(
        {
          userId: getDataUserInUpdate.id,
          nama_lengkap: getDataUserInUpdate.nama_lengkap,
          username: getDataUserInUpdate.username,
          email: getDataUserInUpdate.email,
          no_hp: getDataUserInUpdate.no_hp,
          role: getDataUserInUpdate.role,
          opd_id: getDataUserInUpdate.opd_id,
          fedback: getDataUserInUpdate.is_feedback,
          konfirmasi: getDataUserInUpdate.is_confirm,
        },
        JWT_SECRET
      );

      return res.status(201).json({
        success: true,
        status: 201,
        message: "Data Berhasil Di Update",
        result: {
          getDataUserInUpdate,
          token,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie("token");
      return res.status(200).json({
        success: true,
        status: 200,
        message: "Logout Berhasil",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error,
        },
      });
    }
  },

  disabledUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "User tidak ditemukan",
          },
        });
      }
      user.update({
        status : "tidak aktif",
      })

      return res.status(200).json({
        success: true,
        status: 200,
        message: "User berhasil dinonaktifkan",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },
  deleteUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const usulanSmarts = await UsulanSmart.findAll({
        where: { user_id: id },
      });

      for (const usulanSmart of usulanSmarts) {
        // Hapus usulan ini
        await usulanSmart.destroy();
      }

      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "User tidak ditemukan",
          },
        });
      }

      await user.destroy();
      io.emit("userDeleted", { id });

      return res.status(200).json({
        success: true,
        status: 200,
        message: "User berhasil dihapus",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },

  getByUsername: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username } = req.params;

      const data: any = await User.findAll({
        where: {
          username: username,
        },
        attributes: ["username", "email"],
      });

      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data tidak ditemukan",
          },
        });
      }

      const token = jwt.sign(
        {
          email: data[0].dataValues.email,
        },
        JWT_SECRET,
        {
          expiresIn: "3m",
        }
      );

      const resetLink = `https://siemas.banyuasinkab.go.id/auth/confirmpassword?token=${token}`;

      const transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        service: "gmail",
        port: 587,
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: data[0].dataValues.email,
        subject: "Reset Password",
        html: getResetPasswordTemplate(resetLink),
      };

      transport.sendMail(mailOptions, (error: any) => {
        if (error) {
          console.log(error);
          return res.status(500).send({
            success: false,
            status: 500,
            message: {
              error: error,
            },
          });
        }
        res.status(200).send({
          success: true,
          status: 200,
          message: "Silahkan Check Di Email Anda",
        });
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },

  handleResetValidasi: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.query.token as string;

      jwt.verify(token, JWT_SECRET, (error: any, decoded: any) => {
        if (error) {
          return res.status(401).send({ data: { message: "Invalid token" } });
        }
        return res
          .status(200)
          .send({ data: { message: "Token Verified", email: decoded.email } });
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },

  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.query.token as string;

      let decoded: any;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch (error) {
        return res.status(401).send({ data: { message: "Invalid token" } });
      }

      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: {
            error: "Password Tidak Boleh Kosong",
          },
        });
      }

      const hashedPassword = await bcrypt.hash(password, 11);

      const user = await User.findOne({
        where: {
          email: decoded.email,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "User tidak ditemukan",
          },
        });
      }

      await user.update({
        password: hashedPassword,
      });

      io.emit("userReset", user);
      return res.status(200).json({
        success: true,
        status: 200,
        message: "Berhasil Update Password",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },

  showFotoBrandPemkab: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const filePath = path.join(__dirname, "../../utils/kominfo.png");
      res.sendFile(filePath);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        status: 500,
        message: "Terjadi kesalahan dalam memproses permintaan",
      });
    }
  },

  updateAllAkunForFeedback: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const dataUsers: any = await User.findAll({
        where: {
          role: "admin",
        },
      });

      if (dataUsers.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data tidak ditemukan",
          },
        });
      }
      const updatePromises = dataUsers.map(async (user: any) => {
        await user.update({
          is_feedback: false,
        });
      });
      await Promise.all(updatePromises);
      return res.status(200).json({
        success: true,
        status: 200,
        message:
          "Berhasil mengubah is_feedback menjadi false untuk semua admin",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },
  updateAllAkunForNotFeedback: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const dataUsers: any = await User.findAll({
        where: {
          role: "admin",
        },
      });

      if (dataUsers.length === 0) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: {
            error: "Data tidak ditemukan",
          },
        });
      }
      const updatePromises = dataUsers.map(async (user: any) => {
        await user.update({
          is_feedback: true,
        });
      });

      // 4. Tunggu semua proses update selesai
      await Promise.all(updatePromises);

      // 5. Respon sukses jika berhasil
      return res.status(200).json({
        success: true,
        status: 200,
        message:
          "Berhasil mengubah is_feedback menjadi false untuk semua admin",
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        status: 500,
        message: {
          error: error.message,
        },
      });
    }
  },
};

export default UserController;
