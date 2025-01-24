const { ipcRenderer } = require('electron');

    // Configuração dos servidores
    const servers = [
        {
            id: 1,
            name: 'Servidor Principal',
            host: '5.161.102.128',
            user: 'root',
            password: 'SuaSenhaAqui'
        }
        // Adicione mais servidores conforme necessário
    ];

    // Preenche o select de servidores
    function populateServers() {
        const select = document.getElementById('serverSelect');
        servers.forEach(server => {
            const option = document.createElement('option');
            option.value = server.id;
            option.textContent = server.name;
            select.appendChild(option);
        });
    }

    // Adiciona log
    function addLog(message, type = 'info') {
        const logContent = document.getElementById('logContent');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
    }

    // Selecionar pasta
    document.getElementById('selectFolder').addEventListener('click', async () => {
        const folderPath = await ipcRenderer.invoke('select-folder');
        if (folderPath) {
            document.getElementById('folderPath').value = folderPath;
            updateUploadButton();
        }
    });

    // Atualizar estado do botão de upload
    function updateUploadButton() {
        const folderPath = document.getElementById('folderPath').value;
        const serverId = document.getElementById('serverSelect').value;
        const uploadButton = document.getElementById('uploadButton');
        
        uploadButton.disabled = !folderPath || !serverId;
    }

    // Eventos de select
    document.getElementById('serverSelect').addEventListener('change', updateUploadButton);

    // Iniciar upload
    document.getElementById('uploadButton').addEventListener('click', async () => {
        const folderPath = document.getElementById('folderPath').value;
        const serverId = document.getElementById('serverSelect').value;
        const server = servers.find(s => s.id === parseInt(serverId));

        if (!folderPath || !server) return;

        // Mostrar barra de progresso
        document.querySelector('.upload-progress').style.display = 'block';
        
        // Desabilitar botões durante upload
        document.getElementById('uploadButton').disabled = true;
        document.getElementById('selectFolder').disabled = true;
        document.getElementById('serverSelect').disabled = true;

        addLog(`Iniciando upload para ${server.name}...`);

        ipcRenderer.send('upload-folder', {
            folderPath,
            server
        });
    });

    // Receber progresso do upload
    ipcRenderer.on('upload-progress', (event, message) => {
        addLog(message);
        // Aqui você pode adicionar lógica para atualizar a barra de progresso
        // baseado no output do rsync
        const match = message.match(/(\d+)%/);
        if (match) {
            const percentage = parseInt(match[1]);
            document.getElementById('progressBar').style.width = `${percentage}%`;
            document.getElementById('progressText').textContent = `${percentage}%`;
        }
    });

    ipcRenderer.on('upload-error', (event, message) => {
        addLog(message, 'error');
    });

    ipcRenderer.on('upload-complete', (event, success) => {
        if (success) {
            addLog('Upload concluído com sucesso!', 'success');
        } else {
            addLog('Erro ao realizar upload!', 'error');
        }

        // Resetar interface
        document.querySelector('.upload-progress').style.display = 'none';
        document.getElementById('uploadButton').disabled = false;
        document.getElementById('selectFolder').disabled = false;
        document.getElementById('serverSelect').disabled = false;
    });

    // Inicialização
    populateServers();
