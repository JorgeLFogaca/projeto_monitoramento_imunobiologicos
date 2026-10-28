const socket = io();

const container = document.getElementById('sensores');
const detalheBox = document.getElementById('conteudoDetalhes');

const sensores = {};

// Recebe dados do MQTT pelo servidor
socket.on('mqttData', (data) => {
    const id = data.sensorId;

    if (!sensores[id]) {
        sensores[id] = {
            historico: []
        };
    }

    let payload = data.mensagem;

    // Trata mensagens de status
    if (payload === 'OFFLINE' || payload === 'ONLINE') {
        const status = payload;

        payload = {
            ...sensores[id].payload,
            status,
            alerta: status === 'OFFLINE'
                ? 'SENSOR OFFLINE'
                : (sensores[id].payload?.alerta || 'NORMAL')
        };

    } else {
        // Converte mensagens JSON
        if (typeof payload === 'string') {
            try {
                payload = JSON.parse(payload);
            } catch (e) {
                console.log('JSON inválido:', payload);
                return;
            }
        }

        payload.status = 'ONLINE';
    }

    // Atualiza os dados atuais do sensor
    sensores[id].sensorId = id;
    sensores[id].payload = payload;
    sensores[id].horario = data.horario;
    sensores[id].data = data.data;

    // Guarda no histórico apenas as leituras de temperatura
    if (data.tipoDado === 'temp' || data.tipoDado === 'status') {
    sensores[id].historico.unshift({
        payload: { ...payload },
        horario: data.horario,
        data: data.data
    });

    sensores[id].historico =
        sensores[id].historico.slice(0, 10);
}

    renderizarSensores();

    // Atualiza os detalhes se o sensor estiver selecionado
    if (detalheBox.dataset.sensorId === id) {
        mostrarDetalhes(id);
    }
});


// Define a classe CSS conforme o estado do sensor
function obterClasseEstado(payload) {
    if (payload?.status === 'OFFLINE') {
        return 'offline';
    }

    if (
        payload?.alerta &&
        payload.alerta !== 'NORMAL'
    ) {
        return 'alerta';
    }

    return '';
}


// Renderiza os cards dos sensores
function renderizarSensores() {
    container.innerHTML = '';

    Object.values(sensores).forEach(sensor => {
        const card = document.createElement('div');
        const payload = sensor.payload;

        const estado = obterClasseEstado(payload);

        card.className = `card ${estado}`.trim();

        const nomeFormatado = sensor.sensorId
            .replace(/_/g, ' ')
            .toUpperCase();

        card.innerHTML = `
            <h2>📡 ${nomeFormatado}</h2>
            <div>
                <h2>📍 Local: ${payload?.local || 'N/A'}</h2>
            </div>
        `;

        card.onclick = () => mostrarDetalhes(sensor.sensorId);

        container.appendChild(card);
    });
}


// Exibe o histórico do sensor selecionado
function mostrarDetalhes(id) {
    const sensor = sensores[id];

    if (!sensor) return;

    const nomeFormatado = id
        .replace(/_/g, ' ')
        .toUpperCase();

    // Registra qual sensor está sendo visualizado
    detalheBox.dataset.sensorId = id;

    let historicoHtml = '';

    sensor.historico.forEach(item => {
        const payload = item.payload;
        const estado = obterClasseEstado(payload);
        const classe = `detalhe-box ${estado}`.trim();

        historicoHtml += `
            <div class="${classe}">
                <div class="detalhe-header">
                    <span>
                        📍 ${payload?.local || 'N/A'}
                    </span>

                    <span class="detalhe-temperatura">
                        🌡️ ${payload?.temp ?? '--'}°C
                    </span>
                </div>

                <div class="detalhe-alerta">
                    <span>Estado</span>
                    <strong>
                        ${payload?.alerta || 'N/A'}
                    </strong>
                </div>

                <div class="detalhe-data">
                    <span>🕒 ${item.horario}</span>
                    <span>📅 ${item.data}</span>
                </div>
            </div>
        `;
    });

    detalheBox.innerHTML = `
        <br>
        ${historicoHtml || '<p>Nenhuma leitura registrada.</p>'}
    `;
}
