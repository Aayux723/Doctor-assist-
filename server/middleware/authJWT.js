import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => { 
  try {
    const authHeader = req.headers.authorization;
    //Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
//this is what the auth looks like 

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];//extracts the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //every token has the same JWT_SECRET so it matches that
    //checks the singaure every JWT has HEADER-PAYLOAD-SIG
    //returns the payload(data)

    req.doctor = decoded; //in the req (client side) adds the doc details (payload)
    next(); //moves to the next part 

  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

export default authMiddleware;
