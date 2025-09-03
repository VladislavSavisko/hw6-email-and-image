import nodemailer from 'nodemailer';
import { SMTP } from '../constants/index.js';

export const sendMail = async ({ to, subject, html }) => {
    const transporter = nodemailer.createTransport({
        host: process.env[SMTP.SMTP_HOST],
        port: Number(process.env[SMTP.SMTP_PORT]),
        secure: false, 
        auth: {
            user: process.env[SMTP.SMTP_USER],
            pass: process.env[SMTP.SMTP_PASSWORD],
        },
        tls: {
            rejectUnauthorized: false, 
        },
    });

    const mailOptions = {
        from: process.env[SMTP.SMTP_FROM],
        to,
        subject,
        html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info.messageId);
        return true;
    } catch (err) {
        console.error('Email send error:', err);
        return false;
    }
};
