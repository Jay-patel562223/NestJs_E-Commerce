import { ConfigModule } from '@nestjs/config';
import nodemailer from 'nodemailer';

ConfigModule.forRoot({});

export const sendEmail = async (
  email: string,
  subject: string,
  html: string,
) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, //* true for 465, false for other ports
      auth: {
        user: process.env.MAIL_ID, //* generated ethereal user
        pass: process.env.MP, //* generated ethereal password
      },
    });
    //* send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"E-Commerce " < e-commerce@gmail.com>`, //* sender address
      to: email, //* list of receivers
      subject: subject, //* Subject line
      html: html, //* html body
    });
    return info;
  } catch (error) {
    throw error;
  }
};

export const htmlTemplate = (process: string, otp: number) => {
  return `
   <body>
   <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
       <div style="margin:50px auto;width:70%;padding:20px 0">
           <div style="border-bottom:1px solid #eee">
               <a href="https://quarkssystems.com/" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">E-Commerce</a>
           </div>
           <p style="font-size:1.1em">Hi,</p>
           <p>Thank you for choosing E-Commerce. Use the following OTP to complete your ${process} procedures. OTP is
               valid for 10 minutes</p>
           <h2
               style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">
               ${otp}</h2>
           <p style="font-size:0.9em;">Regards,<br />E-Commerce</p>
           <hr style="border:none;border-top:1px solid #eee" />
           <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
               <p>E-Commerce</p>
               <p>I-Square</p>
               <p>Ahmedabad</p>
           </div>
       </div>
   </div>
</body>
  `;
};
