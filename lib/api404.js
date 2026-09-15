module.exports = function api404(req, res) {
  res.status(404).json({ error: "API endpoint not found" });
};
