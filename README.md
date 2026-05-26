# MINSAL Proxy Service

Servicio backend en Node.js + Express que actúa como proxy para consultar farmacias de turno desde la API pública de MINSAL.

## Descripción

Este servicio expone un endpoint propio (`/minsal/farmacias-turno`) y realiza la consulta a:

- `https://midas.minsal.cl/farmacia_v2/WS/getLocalesTurnos.php`

Incluye validaciones para detectar respuestas inválidas (por ejemplo HTML) o bloqueo por Cloudflare.

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Ejecución

Modo normal:

```bash
npm start
```

Modo desarrollo (con watch):

```bash
npm run dev
```

El servicio corre por defecto en el puerto `3000`.
Puedes cambiarlo con la variable de entorno `PORT`.

Ejemplo:

```bash
PORT=4000 npm start
```

## Endpoints

### `GET /health`
Verifica el estado del servicio.

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "minsal-proxy-service"
}
```

### `GET /minsal/farmacias-turno`
Consulta y retorna la respuesta de farmacias de turno desde MINSAL.

Posibles respuestas de error:

- `502`: MINSAL bloqueó la IP con Cloudflare.
- `502`: MINSAL respondió HTML en vez de JSON.
- `502`: La respuesta de MINSAL no tiene el formato esperado (array).
- `500`: Error general al consultar la API externa.

## Ejemplos rápidos

```bash
curl http://localhost:3000/health
```

```bash
curl http://localhost:3000/minsal/farmacias-turno
```

## Scripts disponibles

- `npm start`: inicia el servidor.
- `npm run dev`: inicia el servidor en modo watch.

## Dependencias principales

- `express`
- `axios`
- `cors`
