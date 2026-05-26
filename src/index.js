const express = require('express');
const cors = require('cors');

const app = express();

const PORT = process.env.PORT || 3000;

const MINSAL_URL =
    'https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php';

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'minsal-proxy-service',
    });
});

app.get('/minsal/farmacias-turno', async (req, res) => {
    try {
        console.log('[MINSAL] Consultando API externa...');

        // 1. Usamos AbortController para simular el timeout de Axios (30 segundos)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        // 2. Usamos fetch nativo
        const response = await fetch(MINSAL_URL, {
            method: 'GET',
            signal: controller.signal, // Vinculamos el timeout
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
                'Connection': 'keep-alive',
                'Referer': 'https://midas.minsal.cl/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            },
        });

        // Limpiamos el timeout si la petición fue exitosa antes de los 30s
        clearTimeout(timeoutId);

        // 3. Obtenemos la respuesta como texto crudo
        const data = await response.text();

        // Validaciones contra bloqueos o errores del MINSAL
        if (typeof data === 'string' && data.includes('Cloudflare')) {
            console.error('[MINSAL] Bloqueado por Cloudflare');
            return res.status(502).json({
                message: 'MINSAL bloqueó esta IP con Cloudflare',
            });
        }

        if (typeof data === 'string' && data.trim().startsWith('<')) {
            console.error('[MINSAL] MINSAL respondió HTML');
            return res.status(502).json({
                message: 'MINSAL respondió HTML en vez de JSON',
            });
        }

        // 4. Parseamos a JSON una vez validado que no es HTML de error
        const parsed = JSON.parse(data);

        if (!Array.isArray(parsed)) {
            return res.status(502).json({
                message: 'La respuesta de MINSAL no es un array',
            });
        }

        console.log(`[MINSAL] Registros recibidos: ${parsed.length}`);

        return res.json(parsed);

    } catch (error) {
        // Manejamos específicamente el error de timeout
        if (error.name === 'AbortError') {
            console.error('[MINSAL] Timeout agotado (30s)');
            return res.status(504).json({
                message: 'Timeout: La API del MINSAL tardó demasiado en responder',
            });
        }

        console.error('[MINSAL] Error:', error.message);

        return res.status(500).json({
            message: 'Error al consultar API de MINSAL',
            error: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`MINSAL proxy running on port ${PORT}`);
});