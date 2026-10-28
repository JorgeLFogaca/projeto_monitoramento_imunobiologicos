
require('dotenv').config();

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

async function sendAlertEmail(assunto, mensagem) {
    try {
        const info = await transporter.sendMail({
            from: `"Monitor de Vacinas" <${process.env.GMAIL_USER}>`,
            to: process.env.ALERT_EMAIL,
            subject: assunto,
            text: mensagem,
            html: `
                <div style="font-family: Arial; padding:20px;">
                    <h2 style="color:red;">🚨 ALERTA CRÍTICO</h2>
                    <p>${mensagem}</p>
                    <hr>
                    <p>Sistema de Monitoramento de Vacinas</p>
                </div>
            `
        });

        console.log('📧 Email enviado!');
        console.log(info.response);

        return info;
    } catch (erro) {
        console.error('❌ Erro ao enviar email:', erro.message);
        throw erro;
    }
}

module.exports = { sendAlertEmail };
