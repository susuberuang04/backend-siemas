import { Request, Response, NextFunction } from "express";
import { models, sequelize } from "../../database/models";
const { UsulanSmart, User, Kategori, Opd, Progres, FeedBack } = models;
import { Op } from "sequelize";
function formatPersentase(value: number): string {
  return value.toFixed(0);
}

interface ProgresInstance {
  createdAt: Date;
}

const DashboardController = {
  dashboardDataUntukOther: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const searchTerm = req.query.search;
    const {  opdId } = req.params;
    try {
      const allUsers = await User.findAll({
        where: { opd_id: opdId }
      });
      const userIds = allUsers.map((user: any) => user.id); // Pakai `any` untuk sementara jika tipe model belum didefinisikan
      const totalAkun = await allUsers.length;

      const TotalData = await UsulanSmart.count({
        where: { user_id: userIds }
      });
      const totalKategori = await Kategori.count().catch(() => 0);
      const totalOpd = await Opd.count().catch(() => 0);

      const dataFix = {
        totalData: TotalData || 0,
        totalAkunTerdaftar: totalAkun || 0,
        totalDimensiSmart: totalKategori || 0,
        totalInstansi: totalOpd || 0,
      };
      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: dataFix,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error: error,
      });
    }
  },
  dashboardDataUntukAdmin: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const TotalData = await UsulanSmart.count().catch(() => 0);
      const totalAkun = await User.count().catch(() => 0);
      const totalKategori = await Kategori.count().catch(() => 0);
      const totalOpd = await Opd.count().catch(() => 0);

      const dataFix = {
        totalData: TotalData || 0,
        totalAkunTerdaftar: totalAkun || 0,
        totalDimensiSmart: totalKategori || 0,
        totalInstansi: totalOpd || 0,
      };
      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: dataFix,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error: error,
      });
    }
  },
  dashboardDataUntukAdminPersentaseStatusAccount: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const allUsers = await User.findAll();

      let countAktif = 0;
      let countTidakAktif = 0;
      let countBanned = 0;

      // Hitung jumlah masing-masing status
      allUsers.forEach((user: any) => {
        if (user.status === "aktif") {
          countAktif++;
        } else if (user.status === "tidak aktif") {
          countTidakAktif++;
        } else if (user.status === "banned") {
          countBanned++;
        }
      });

      // Hitung total akun
      const totalAkun = allUsers.length;

      // Hitung persentase masing-masing status (pastikan tidak terjadi division by zero)
      const persentaseAktif =
        totalAkun > 0 ? (countAktif / totalAkun) * 100 : 0;
      const persentaseTidakAktif =
        totalAkun > 0 ? (countTidakAktif / totalAkun) * 100 : 0;
      const persentaseBanned =
        totalAkun > 0 ? (countBanned / totalAkun) * 100 : 0;

      const responseData = {
        totalAkun: totalAkun,
        persentaseAktif: formatPersentase(persentaseAktif),
        persentaseTidakAktif: formatPersentase(persentaseTidakAktif),
        persentaseBanned: formatPersentase(persentaseBanned),
      };

      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: responseData,
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error: error,
      });
    }
  },

  dashboardDataUntukAdminChart: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const latetUpdateUsulan: any = await UsulanSmart.findOne({
        order: [["createdAt", "DESC"]],
      });

      if (!latetUpdateUsulan) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Data tidak ditemukan",
        });
      }

      const updatedAt = new Date(latetUpdateUsulan.updatedAt); // Konversi updatedAt ke objek Date
      const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
      };

      const formattedDate = new Intl.DateTimeFormat("id-ID", options).format(
        updatedAt
      );

      const kategoriList = await Kategori.findAll({
        attributes: ["id", "jenis_smart"],
      });

      const totalDataPerKategori = await Promise.all(
        kategoriList.map(async (kategori: any) => {
          const totalData = await UsulanSmart.count({
            where: {
              kategori_id: kategori.id,
            },
          });

          let opdSelesaiUpload = null;
          if (totalData > 0) {
            const usulanList = await UsulanSmart.findAll({
              attributes: ["user_id"],
              where: { kategori_id: kategori.id },
            });

            const userIds = usulanList.map((usulan: any) => usulan.user_id);

            const users = await User.findAll({
              attributes: ["id", "opd_id"],
              where: { id: userIds },
            });

            const opdIds = users.map((user: any) => user.opd_id);

            const opds = await Opd.findAll({
              attributes: ["id", "nama_opd"],
              where: { id: opdIds },
            });

            opdSelesaiUpload = opds.map((opd: any) => {
              const jumlahData = usulanList.filter((usulan: any) => {
                const user: any = users.find(
                  (user: any) => user.id === usulan.user_id
                );
                return user && user.opd_id === opd.id;
              }).length;
              return {
                opd_id: opd.id,
                nama_opd: opd.nama_opd,
                jumlah_data: jumlahData,
              };
            });
          }

          return {
            id: kategori.id,
            jenis_smart: kategori.jenis_smart,
            totalData: totalData,
            opd_selesai_upload: opdSelesaiUpload,
          };
        })
      );

      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: totalDataPerKategori,
        terakhir_diupdate: formattedDate,
      });
    } catch (error: any) {
      res.status(500).json({
        message: "Internal Server Error",
        error: error,
      });
    }
  },

  dashboardDataUntukUser: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId } = req.params;

      // Dapatkan semua kategori
      const allCategories = await Kategori.findAll();

      // Inisialisasi objek hasil dengan nilai default 0 untuk setiap jenis_smart
      let dataFix: any = {};
      allCategories.forEach((kategori: any) => {
        dataFix[`jumlah ${kategori.jenis_smart}`] = 0;
      });

      // Dapatkan data dari UsulanSmart berdasarkan userId
      const dataUsulanSmart = await UsulanSmart.findAll({
        where: { user_id: userId },
        attributes: [
          "kategori_id",
          [sequelize.fn("COUNT", sequelize.col("kategori_id")), "jumlah"],
        ],
        group: ["kategori_id"],
      });

      // Update dataFix dengan jumlah yang sesuai
      dataUsulanSmart.forEach((usulan: any) => {
        const kategori: any = allCategories.find(
          (kategori: any) => kategori.id === usulan.kategori_id
        );
        if (kategori) {
          dataFix[`jumlah ${kategori.jenis_smart}`] = usulan.dataValues.jumlah;
        }
      });

      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: dataFix,
      });
    } catch (error: any) {
      res.status(500).json({
        message: "Internal Server Error",
        error: error.message,
      });
    }
  },
  dashboardDataUntukUserGrafikKeaktifanTambahProgres: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId } = req.params;

      const latestProgres: any = await Progres.findOne({
        where: {
          user_id: userId,
        },
        order: [["createdAt", "DESC"]],
      });

      if (!latestProgres) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Data tidak ditemukan",
        });
      }

      const updatedAt = new Date(latestProgres.updatedAt); // Konversi updatedAt ke objek Date
      const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
      };

      const formattedDate = new Intl.DateTimeFormat("id-ID", options).format(
        updatedAt
      );

      const progresData = await Progres.findAll({
        where: {
          user_id: userId,
        },
        attributes: ["createdAt"],
      });

      // Inisialisasi objek untuk menyimpan jumlah progres per bulan
      const monthCounts: any = {
        Januari: 0,
        Februari: 0,
        Maret: 0,
        April: 0,
        Mei: 0,
        Juni: 0,
        Juli: 0,
        Agustus: 0,
        September: 0,
        Oktober: 0,
        November: 0,
        Desember: 0,
      };

      const monthNames = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ];

      progresData.forEach((progres) => {
        const createdAt = new Date(
          (progres as unknown as ProgresInstance).createdAt
        );
        const month = createdAt.getMonth();
        const monthName = monthNames[month];
        monthCounts[monthName]++;
      });
      const result = monthNames.map((name) => ({
        name: name,
        y: monthCounts[name],
      }));
      res.status(200).json({
        success: true,
        status: 200,
        message: "Data Ditemukan",
        result: {
          is_data: result,
          terakhir_diupdate: formattedDate,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error",
        error: error,
      });
    }
  },

  SuperAdminChartTerajinMenambahProgres: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const latestProgres: any = await Progres.findOne({
        order: [["createdAt", "DESC"]],
      });

      if (!latestProgres) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Data tidak ditemukan",
        });
      }

      const updatedAt = new Date(latestProgres.updatedAt); // Konversi updatedAt ke objek Date
      const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
      };

      const formattedDate = new Intl.DateTimeFormat("id-ID", options).format(
        updatedAt
      );

      const latestProgressPerUser: any = await Progres.findAll({
        attributes: [
          "user_id",
          [sequelize.fn("max", sequelize.col("createdAt")), "latestCreatedAt"],
          [sequelize.fn("count", sequelize.col("*")), "progressCount"],
        ],
        group: ["user_id"],
        order: [[sequelize.literal("progressCount"), "DESC"]],
        limit: 10,
        raw: true,
      });

      const userIDs: any = latestProgressPerUser.map(
        (progress: any) => progress.user_id
      );

      const users: any = await User.findAll({
        attributes: ["id", "nama_lengkap", "opd_id"],
        where: {
          id: { [Op.in]: userIDs },
        },
        raw: true,
      });

      const opdIDs: any = users.map((user: any) => user.opd_id);

      const opds: any = await Opd.findAll({
        attributes: ["id", "nama_opd"],
        where: {
          id: { [Op.in]: opdIDs },
        },
        raw: true,
      });

      const result: any = latestProgressPerUser
        .map((progress: any) => {
          const user: any = users.find((u: any) => u.id === progress.user_id);
          if (user) {
            const opd: any = opds.find((o: any) => o.id === user.opd_id);
            return {
              // user_id: progress.user_id,
              user_name: user.nama_lengkap,
              nama_opd: opd ? opd.nama_opd : "Unknown",
              progress_count: progress.progressCount,
            };
          }
          return null;
        })
        .filter((item: any) => item !== null);

      if (!result.length) {
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
        result: result,
        terakhir_diupdate: formattedDate,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error,
      });
    }
  },

  SuperAdminDaftarOpdBelumMengupload: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const latestProgres: any = await UsulanSmart.findOne({
        order: [["createdAt", "DESC"]],
      });

      if (!latestProgres) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Data tidak ditemukan",
        });
      }

      const updatedAt = new Date(latestProgres.updatedAt); // Konversi updatedAt ke objek Date
      const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
      };

      const formattedDate = new Intl.DateTimeFormat("id-ID", options).format(
        updatedAt
      );

      const opdList = await Opd.findAll();

      // Retrieve all Users
      const userList = await User.findAll();

      // Retrieve all entries in usulanSmart
      const usulanSmartList = await UsulanSmart.findAll();
      const uploadedUserIds = usulanSmartList.map(
        (usulan: any) => usulan.user_id
      );

      // Find OPDs whose users haven't uploaded
      const dataBelumMengupload = opdList.filter((opd: any) => {
        // Get users belonging to this OPD
        const opdUsers = userList.filter((user: any) => user.opd_id === opd.id);

        // Check if none of the users from this OPD have uploaded
        return opdUsers.every(
          (user: any) => !uploadedUserIds.includes(user.id)
        );
      });

      if (dataBelumMengupload.length === 0) {
        return res.status(200).json({
          success: false,
          status: 200,
          message: "Seluruh OPD sudah mengupload",
          result: [],
          terakhir_diupdate: formattedDate,
        });
      }

      res.status(200).json({
        success: true,
        status: 200,
        message: "Data ditemukan",
        result: dataBelumMengupload,
        terakhir_diupdate: formattedDate,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error,
      });
    }
  },

  SuperAdminDaftarOpdBelumProgres: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const latestProgres: any = await Progres.findOne({
        order: [["createdAt", "DESC"]],
      });

      if (!latestProgres) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Data tidak ditemukan",
        });
      }

      const updatedAt = new Date(latestProgres.updatedAt); // Konversi updatedAt ke objek Date
      const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
      };

      const formattedDate = new Intl.DateTimeFormat("id-ID", options).format(
        updatedAt
      );

      const opdList = await Opd.findAll();

      // Retrieve all Users
      const userList = await User.findAll();

      // Retrieve all entries in usulanSmart
      const usulanSmartList = await Progres.findAll();
      const uploadedUserIds = usulanSmartList.map(
        (usulan: any) => usulan.user_id
      );

      // Find OPDs whose users haven't uploaded
      const dataBelumMengupload = opdList.filter((opd: any) => {
        // Get users belonging to this OPD
        const opdUsers = userList.filter((user: any) => user.opd_id === opd.id);

        // Check if none of the users from this OPD have uploaded
        return opdUsers.every(
          (user: any) => !uploadedUserIds.includes(user.id)
        );
      });

      if (dataBelumMengupload.length === 0) {
        return res.status(200).json({
          success: false,
          status: 200,
          message: "Seluruh OPD sudah mengupload",
          result: [],
          terakhir_diupdate: formattedDate,
        });
      }

      res.status(200).json({
        success: true,
        status: 200,
        message: "Data ditemukan",
        result: dataBelumMengupload,
        terakhir_diupdate: formattedDate,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error,
      });
    }
  },

  SuperadminFiveNewFeedback: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const latestProgres: any = await FeedBack.findOne({
        order: [["createdAt", "DESC"]],
      });

      if (!latestProgres) {
        return res.status(404).json({
          success: false,
          status: 404,
          message: "Data tidak ditemukan",
        });
      }

      const updatedAt = new Date(latestProgres.updatedAt); // Konversi updatedAt ke objek Date
      const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
      };

      const formattedDate = new Intl.DateTimeFormat("id-ID", options).format(
        updatedAt
      );

      const newFeedback = await FeedBack.findAll({
        order: [["createdAt", "DESC"]],
        limit: 5,
      });

      res.status(200).json({
        success: true,
        status: 200,
        message: "Data ditemukan",
        result: newFeedback,
        terakhir_diupdate: formattedDate,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Internal Server Error",
        error: error,
      });
    }
  },

  // SuperAdminChartTerajinMenambahProgresPerbulan: async (
  //   req: Request,
  //   res: Response,
  //   next: NextFunction
  // ) => {
  //   try {
  //     const latetUpdateUsulan: any = await Progres.findOne({
  //       order: [["createdAt", "DESC"]],
  //     });

  //     if (!latetUpdateUsulan) {
  //       return res.status(404).json({
  //         success: false,
  //         status: 404,
  //         message: "Data tidak ditemukan",
  //       });
  //     }

  //     const updatedAt = new Date(latetUpdateUsulan.updatedAt); // Konversi updatedAt ke objek Date
  //     const options: Intl.DateTimeFormatOptions = {
  //       day: "numeric",
  //       month: "long",
  //       year: "numeric",
  //     };

  //     const formattedDate = new Intl.DateTimeFormat("id-ID", options).format(
  //       updatedAt
  //     );

  //     const lastMonth = new Date();
  //     lastMonth.setMonth(lastMonth.getMonth() - 1);

  //     const userAll = await User.findAll();

  //     const userProgress = await Promise.all(
  //       userAll.map(async (user: any) => {
  //         const countProgress = await Progres.count({
  //           where: {
  //             user_id: user.id,
  //             createdAt: { [Op.gte]: lastMonth },
  //           },
  //         });
  //         return {
  //           user_id: user.id,
  //           nama_opd: user.opd_id,
  //           countProgress: countProgress,
  //         };
  //       })
  //     );

  //     // Membuat map untuk menyimpan jumlah progress per nama_opd
  //     const opdProgressMap = new Map();
  //     userProgress.forEach((progress) => {
  //       const opdKey = `${progress.nama_opd}_${progress.countProgress}`;
  //       if (!opdProgressMap.has(opdKey)) {
  //         opdProgressMap.set(opdKey, progress);
  //       }
  //     });

  //     // Mengubah Map menjadi array untuk diurutkan
  //     const sortedProgress = Array.from(opdProgressMap.values());

  //     // Mengurutkan berdasarkan countProgress secara descending
  //     sortedProgress.sort((a, b) => b.countProgress - a.countProgress);

  //     // Mengambil 10 entri pertama
  //     const topUsers = sortedProgress.slice(0, 10);

  //     // Mengambil nama opd dari model OPD
  //     await Promise.all(
  //       topUsers.map(async (progress: any) => {
  //         if (progress.nama_opd) {
  //           const opd: any = await Opd.findByPk(progress.nama_opd); // Ganti dengan nama model dan field yang sesuai
  //           progress.nama_opd = opd ? opd.nama_opd : null;
  //         }
  //       })
  //     );

  //     res.status(200).json({
  //       success: true,
  //       status: 200,
  //       message: "Data Ditemukan",
  //       topUsersPerMonth: topUsers,
  //       terakhir_diupdate: formattedDate, // Pastikan formattedDate sudah didefinisikan di kode Anda
  //     });
  //   } catch (error: any) {
  //     res.status(500).json({
  //       message: "Internal Server Error",
  //       error: error,
  //     });
  //   }
  // },
};

export default DashboardController;
