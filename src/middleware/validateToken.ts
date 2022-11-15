const jwt = require("jsonwebtoken")
const config = require('config')



const verifyToken = async (req: any, res: any, next: any) => {
    const token =
        req?.headers?.authorization.split(' ')[1] ?? [];
    if (!token) {
        return res.status(403).send("A token is required for authentication");
    } else {
        try {
            const verified = jwt.verify(
                token,
                JSON.stringify(config.get("JWT_ACCESS_SECRET")),
                {
                    expiresIn: config.get("JWT_ACCESS_TIME")
                }
            );
            next();
        } catch (err) {
            console.log(err);
            res.status(400).json('Token not valid')
        }


    }
    // try {
    //     const getoken = config.get("JWT_ACCESS_SECRET");
    //     const verified = jwt.verify(token,getoken);
    //     req.user = verified;
    //     next();
    // } catch (e) {
    //     console.log(e)  ;
    //     res.status(400).json('Token not valid')
    // }

};
module.exports = verifyToken;