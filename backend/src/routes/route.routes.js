const express = require('express');
const axios = require('axios');

const router = express.Router();

// Servidores OSRM públicos (sem API key). O backend (TLS 1.3 OK) os alcança
// sem o problema de handshake que afeta alguns dispositivos/emuladores Android.
const OSRM_HOSTS = [
  'https://router.project-osrm.org',
  'https://routing.openstreetmap.de/routed-car'
];

const COORD_RE = /^-?\d{1,3}(\.\d+)?,-?\d{1,3}(\.\d+)?$/;

/**
 * GET /api/route?from=lng,lat&to=lng,lat
 * Retorna a rota de carro (geometria + distância + duração) entre dois pontos,
 * consultando o OSRM no servidor e devolvendo um JSON enxuto para o app.
 */
router.get('/', async (req, res) => {
  const { from, to } = req.query;
  if (!from || !to || !COORD_RE.test(from) || !COORD_RE.test(to)) {
    return res.status(400).json({ ok: false, error: 'Parâmetros from/to inválidos (esperado "lng,lat")' });
  }

  const path = `/route/v1/driving/${from};${to}?overview=full&geometries=geojson`;
  let lastError = null;

  for (const host of OSRM_HOSTS) {
    try {
      const { data } = await axios.get(host + path, {
        timeout: 12000,
        headers: { 'User-Agent': 'AquiResolve-Backend/1.0' }
      });
      const route = data && data.routes && data.routes[0];
      if (route && route.geometry && Array.isArray(route.geometry.coordinates)) {
        return res.status(200).json({
          ok: true,
          distance: route.distance,
          duration: route.duration,
          coordinates: route.geometry.coordinates // [[lng,lat], ...]
        });
      }
      lastError = 'sem rota na resposta OSRM';
    } catch (err) {
      lastError = err.message;
    }
  }

  return res.status(502).json({ ok: false, error: `Roteamento indisponível: ${lastError}` });
});

module.exports = router;
