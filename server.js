require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');

const { sendAlertEmail } = require('./mailer');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const brokerUrl = 'ws://broker.hivemq.com:8000/mqtt';

const mqttClient = mqtt.connect(brokerUrl, {
    clientId: 'monitor_web_' + Math.random().toString(16).substring(2, 8),
    connectTimeout: 30000,
    keepalive: 60,
});

const TOPICO_GERAL = 'projeto_iot/cidade/#';

mqttClient.on('connect', () => {
    console.log('✅ Conectado ao broker MQTT');
    mqttClient.subscribe(TOPICO_GERAL);
});

const alertasEnviados = {};
mqttClient.on('message', async (topic, message) => {

    const msgStr = message.toString();

    const partes = topic.split('/');

    const sensorId = partes[2];
    const tipoDado = partes[3];

    const agora = new Date();

    // tenta converter JSON
    let payloadJson = null;

    try {

        payloadJson = JSON.parse(msgStr);

    } catch {

        payloadJson = null;
    }

    // envia email se houver alerta
    if (payloadJson && payloadJson.alerta !== 'NORMAL') {

        // evita spam
        if (!alertasEnviados[sensorId]) {

            alertasEnviados[sensorId] = true;

            await sendAlertEmail(

                '🚨 ALERTA DE TEMPERATURA',

                `
Local: ${payloadJson.local}

Temperatura: ${payloadJson.temp}°C

Alerta: ${payloadJson.alerta}
                `
            );
        }

    } else {

        // reset quando voltar ao normal
        alertasEnviados[sensorId] = false;
    }

    const payload = {
        sensorId,
        tipoDado,
        mensagem: msgStr,
        horario: agora.toLocaleTimeString('pt-BR'),
        data: agora.toLocaleDateString('pt-BR')
    };

    io.emit('mqttData', payload);
});

server.listen(3000, () => {
    console.log('🌐 Servidor rodando em http://localhost:3000');
});