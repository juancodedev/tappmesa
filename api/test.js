// Simple test endpoint
module.exports = async function handler(req, res) {
  res.status(200).json({
    message: 'API funcionando correctamente',
    method: req.method,
    timestamp: new Date().toISOString()
  });
};