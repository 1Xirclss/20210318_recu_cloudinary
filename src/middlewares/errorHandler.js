export const notFound = (req, res) => {
  res.status(404).json({
    ok: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (error, _req, res, _next) => {
  console.error(error);

  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      ok: false,
      message: "La imagen no puede superar 5 MB",
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      ok: false,
      message: "Ese correo ya esta registrado",
    });
  }

  return res.status(error.status || 500).json({
    ok: false,
    message: error.message || "Error interno del servidor",
  });
};
