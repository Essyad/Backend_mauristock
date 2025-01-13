const jwt = require('jsonwebtoken');


module.exports = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Veuillez vous connecter pour continuer.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.adminId = decoded.id;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Session invalide. Veuillez vous reconnecter.' });
  }
};
