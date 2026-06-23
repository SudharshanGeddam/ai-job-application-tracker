const nodemailer = require('nodemailer');

const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
        },
    });
};

const sendEmail = async ({ to, subject, html }) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: `"Job Tracker" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[Email] Sent to ${to} | MessageId: ${result.messageId}`);
    return result;
};

module.exports = { sendEmail };