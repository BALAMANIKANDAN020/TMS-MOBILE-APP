module.exports = function(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.roleName)) {
            return res.status(403).json({ msg: 'Access denied' });
        }
        next();
    }
};