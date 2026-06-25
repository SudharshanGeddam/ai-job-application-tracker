const nodemailer = require('nodemailer');

// Create the transporter once at module load time and reuse it.
// Creating it per-call is wasteful — it establishes a new SMTP connection each time.
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

/**
 * Sends an HTML email.
 * @param {object} params
 * @param {string} params.to - recipient email address
 * @param {string} params.subject - email subject line
 * @param {string} params.html - HTML body content
 * @returns {Promise<object>} nodemailer send result
 */
const sendEmail = async ({ to, subject, html }) => {
    const mailOptions = {
        from: `"Job Tracker" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`[Email] Sent to ${to} | Subject: "${subject}" | MessageId: ${result.messageId}`);
    return result;
};

module.exports = { sendEmail };