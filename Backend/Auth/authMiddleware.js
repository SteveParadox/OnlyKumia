import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization?.startsWith("Bearer ")) {
      throw new Error("No token provided");
    }

    const token = req.headers.authorization.split("Bearer ")[1];

    // Decode header WITHOUT verifying the token
    const header = JSON.parse(
      Buffer.from(token.split(".")[0], "base64").toString()
    );

    let decodedToken;

    if (header.kid) {
      // 🔥 Firebase token
      decodedToken = await admin.auth().verifyIdToken(token);

      req.user = {
        uid: decodedToken.uid,
        displayName: decodedToken.name,
        email: decodedToken.email,
        picture: decodedToken.picture,
        emailVerified: decodedToken.email_verified
      };

    } else {
      // 🔐 Custom JWT
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);

      req.user = {
        uid: decodedToken.userId || decodedToken.uid,
        email: decodedToken.email,
        displayName: decodedToken.displayName || null,
        picture: decodedToken.picture || null,
        emailVerified: decodedToken.emailVerified || false
      };
    }

    // Save user in session if needed
    if (req.session) req.session.user = req.user;

    // Ensure user exists in database
    let existingUser = await User.findOne({ uid: req.user.uid });
    if (!existingUser) {
      const newUser = new User({
        uid: req.user.uid,
        displayName: req.user.displayName,
        email: req.user.email,
        picture: req.user.picture,
        emailVerified: req.user.emailVerified
      });
      await newUser.save();
    }

    next();
  } catch (error) {
    console.error("Auth error:", error);

    return res.status(401).json({
      error: "Unauthorized",
      details: error.message
    });
  }
};

export default authMiddleware;
