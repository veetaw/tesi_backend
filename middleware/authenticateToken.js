const admin = require("firebase-admin");

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "Token non fornito" });
    }

    const token = authHeader.split(" ")[1];
    
    const decodedToken = await admin.auth().verifyIdToken(token);

    req.user = decodedToken;
    next();
  } catch (error) {
    console.log(error);
    res.status(403).json({ error: "Token non valido" });
  }
};

module.exports = authenticateToken;