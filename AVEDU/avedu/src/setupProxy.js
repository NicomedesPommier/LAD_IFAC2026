// src/setupProxy.js
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Estáticos del contenedor (URDF/meshes)
  app.use(
    '/qcar_static',
    createProxyMiddleware({
      target: 'http://127.0.0.1:7000',
      changeOrigin: true,
      pathRewrite: { '^/qcar_static': '' },
      logLevel: 'silent',
    })
  );

  // WebSocket rosbridge
  app.use(
    '/rosbridge',
    createProxyMiddleware({
      target: 'http://127.0.0.1:9090',
      changeOrigin: true,
      ws: true,
      secure: false,
      logLevel: 'silent',
    })
  );

  // WebSocket terminal PTY (Django Channels at port 8000)
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
      ws: true,
      secure: false,
      logLevel: 'silent',
    })
  );
};
