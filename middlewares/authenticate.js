const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  logger.info(
    `[AUTH MIDDLEWARE] Request received - Token: ${
      token ? "Provided" : "Not Provided"
    }`
  );

  if (!token) {
    logger.warn(`[AUTH MIDDLEWARE] No token provided - User not authorized`);
    return res
      .status(401)
      .json({ message: "UnAuthorized. Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.info(
      `[AUTH MIDDLEWARE] Token verified successfully - User ID: ${decoded.id}`
    );
    next();
  } catch (err) {
    logger.error(`[AUTH MIDDLEWARE] Invalid token - Error: ${err.message}`);
    res.status(401).json({ message: "UnAuthorized. Invalid token." });
  }
};
