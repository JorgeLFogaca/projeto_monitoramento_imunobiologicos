const socket = io();
socket.on('connect', () => {
    console.log('Socket conectado:', socket.id);
});

socket.on('connect_error', (erro) => {
    console.error('Erro Socket.IO:', erro.message);
});

socket.on('mqttData', (data) => {
    console.log('Frontend recebeu:', data);
});

const container = document.getElementById('sensores');
const detalheBox = document.getElementById('conteudoDetalhes');

const sensores = {};

socket.on('mqttData', (data) => {

    const id = data.sensorId;

    if (!sensores[id]) {
        sensores[id] = {
            historico: []
        };
    }

    let payload = data.mensagem;

    // se vier OFFLINE

    if (payload === 'OFFLINE' || payload === 'ONLINE') {

        const status = payload;

        payload = {
            ...sensores[id]?.payload,
            status: status,
            alerta: status === 'OFFLINE'
                ? 'SENSOR OFFLINE'
                : (sensores[id]?.payload?.alerta || 'NORMAL')
        };

    } else {

        // Tenta converter JSON
        if (typeof payload === 'string') {
            try {
                payload = JSON.parse(payload);
            } catch (e) {
                console.log("JSON inválido:", payload);
                return;
            }
        }

        // Garante status online
        payload.status = 'ONLINE';
    }


    sensores[id].sensorId = id;
    sensores[id].payload = payload;
    sensores[id].horario = data.horario;
    sensores[id].data = data.data;

    sensores[id].historico.unshift({
        payload: payload,
        horario: data.horario,
        data: data.data
    });

    renderizarSensores();
});

function renderizarSensores() {

    container.innerHTML = '';

    Object.values(sensores).forEach(sensor => {

        const card = document.createElement('div');

        let classe = 'card';

        const payload = sensor.payload;

        if (payload?.status === 'OFFLINE') {
            classe += ' offline';
        }

        if (payload?.alerta !== 'NORMAL') {
            classe += ' alerta';
        }

        card.className = classe;

        const nomeFormatado = sensor.sensorId
            .replace(/_/g, ' ')
            .toUpperCase();

        card.innerHTML = `
                <h2>📍 ${nomeFormatado}</h2>

                <div>
                    <p>📍 Local: ${payload?.local || 'N/A'}</p>
                    <p>🌡️ Temperatura: ${payload?.temp ?? '--'}°C</p>
                    <p>📢 Alerta: ${payload?.alerta || 'N/A'}</p>
                </div>

                <p class="status">
                    🕒 ${sensor.horario}
                    📅 ${sensor.data}
                </p>
            `;

        card.onclick = () => mostrarDetalhes(sensor.sensorId);

        container.appendChild(card);
    });
}

function mostrarDetalhes(id) {

    const sensor = sensores[id];

    const nomeFormatado = id
        .replace(/_/g, ' ')
        .toUpperCase();

    let historicoHtml = '';

    sensor.historico.slice(0, 10).forEach(item => {

        historicoHtml += `
                <div class="detalhe-box">
                    <p>📍 ${item.payload?.local || 'N/A'}</p>
                    <p>🌡️ ${item.payload?.temp ?? '--'}°C</p>
                    <p>📢 ${item.payload?.alerta || 'N/A'}</p>
                    <p>🕒 ${item.horario}</p>
                    <p>📅 ${item.data}</p>
                </div>
                <br>
            `;
    });

    detalheBox.innerHTML = `
            <h3>${nomeFormatado}</h3>
            <br>
            ${historicoHtml}
        `;
}