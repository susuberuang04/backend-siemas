export const getResetPasswordTemplate = (resetLink: string): string =>
  `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SIEMAS - Reset Password Verification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #29569f;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .container {
        width: 100%;
        margin-top: 100px !important;
        margin-bottom: 50px !important;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        box-sizing: border-box;
      }
      .card-logo {
        background-image: url(https://frans-dusky.vercel.app/assets/img/tumbnail1.png);
        width: 100%;
        border-radius: 12px 12px 0px 0px !important;
        height: 120px;
        background-repeat: no-repeat;
        background-size: contain;
        background-position: 5px;
      }
      .card-ttd {
        background-image: url(https://siemas.banyuasinkab.go.id/logo-siemas.png);
        background-size: contain;
      }
      .header {
        text-align: center;
        padding: 20px 0;
      }
      .header h1 {
        color: #29569f;
        font-size: 28px;
        margin: 0;
      }
      .content {
        padding: 20px;
      }
      .content p {
        font-size: 16px;
        color: #333333;
        line-height: 1.5;
        margin-bottom: 20px;
      }
      .button {
        text-align: center;
        margin: 20px 0;
      }
      .button a {
        background-color: #29569f;
        color: #ffffff;
        padding: 12px 24px;
        text-decoration: none;
        font-size: 16px;
        border-radius: 5px;
        display: inline-block;
      }
      .button a:hover {
        background-color: #1f457a;
      }
      .footer {
        text-align: center;
        padding: 10px 0;
        font-size: 14px;
        color: #999999;
      }
      .ttd-logo {
        display: block;
        margin-bottom: -20px !important;
        margin-left: -5px !important;
      }
      @media only screen and (max-width: 600px) {
        .container {
          padding: 10px;
          width: 90%;
        }
        .header h1 {
          font-size: 24px;
        }
        .content p {
          font-size: 14px;
        }
        .button a {
          padding: 10px 20px;
          font-size: 14px;
        }
        .footer {
          font-size: 12px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>SIEMAS</h1>
      </div>
      <div class="content">
        <p>Dear User,</p>
        <p>
          Kami menerima permintaan untuk mengatur ulang kata sandi akun SIEMAS
          Anda. Klik tombol di bawah untuk mengatur ulang kata sandi Anda, Serta
          Batas nya Hanya 1 Menit, Lebih dari 1 menit harus:
        </p>
        <div class="button">
          <a href="${resetLink}" target="_blank">Reset Password</a>
        </div>
        <p>
          Jika Anda tidak ingin atau tidak membutuhkan reset password, abaikan
          saja email ini.
        </p>
        <p>
          Terimakasih,
          <img
            src="https://siemas.banyuasinkab.go.id/logo-siemas.png"
            alt="logo"
            width="100"
            class="ttd-logo"
          />
          <br />
          CS SIEMAS
        </p>
      </div>
      <div class="footer">
        <p>&copy; 2024 SIEMAS. All rights reserved.</p>
        <img
          src="https://frans-dusky.vercel.app/assets/img/tumbnail3.png"
          style="width: 300px"
        />
      </div>
    </div>
  </body>
</html>

`;
