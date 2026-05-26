const express = require('express');
const axios = require('axios');
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

        const response = await axios.get(MINSAL_URL, {
            responseType: 'text',
            timeout: 30000,
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
                'Connection': 'keep-alive',
                'Referer': 'https://midas.minsal.cl/',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'X-Requested-With': 'XMLHttpRequest' // Muy importante para APIs PHP antiguas
            },
        });

        const data = response.data;

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

        const parsed = typeof data === 'string' ? JSON.parse(data) : data;

        if (!Array.isArray(parsed)) {
            return res.status(502).json({
                message: 'La respuesta de MINSAL no es un array',
            });
        }

        console.log(`[MINSAL] Registros recibidos: ${parsed.length}`);

        return res.json(parsed);
    } catch (error) {
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