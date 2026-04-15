const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    // 1️⃣ Get token from header
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ message: "No token, access denied" });
    }

    // 2️⃣ Extract token (remove Bearer)
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    // 3️⃣ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4️⃣ IMPORTANT: attach id + role
    req.user = {
      id: decoded.id,
      role: decoded.role
    };

    next();

  } catch (error) {
    console.log("Auth Error:", error.message);
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = auth;