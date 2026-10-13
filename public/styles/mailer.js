const nodemailer = require('nodemailer');

async function sendAlertEmail(assunto, mensagem) {

    const transporter = nodemailer.createTransport({

        service: 'gmail',

        auth: {
            user: 'trabalhoiot0@gmail.com',
            pass: 'eirbwabijsnizbth'
        }
    });

    try {

        const info = await transporter.sendMail({

            from: '"Monitor de Vacinas" <trabalhoiot0@gmail.com>',

            to: 'jorgelf007@gmail.com',

            subject: assunto,

            text: mensagem,

            html: `
                <div style="font-family: Arial; padding:20px;">

                    <h2 style="color:red;">
                        🚨 ALERTA CRÍTICO
                    </h2>

                    <p>${mensagem}</p>

                    <hr>

                    <p>
                        Sistema de Monitoramento de Vacinas
                    </p>

                </div>
            `
        });

        console.log('📧 Email enviado!');
        console.log(info.response);

    } catch (erro) {

        console.log('❌ Erro ao enviar email');
        console.log(erro);
    }
}

module.exports = { sendAlertEmail };