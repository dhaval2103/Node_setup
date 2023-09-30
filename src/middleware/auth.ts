import { Request, Response } from "express";
import commonutils from "../utils/commonutils";
import redisClient from "../utils/redisHelper";
import aes from "../utils/aes";
import { validateString } from "../utils/AppString";
import { ObjectId } from "mongoose";

const config = require('config');
const jwt = require('jsonwebtoken');

// const getAccessToken = async (payload: any) => {
//     try {
//         if (payload) {
//             const accessToken = jwt.sign({
//                 userId: payload._id,
//                 email: payload.email
//             },
//                 JSON.stringify(config.get("JWT_ACCESS_SECRET")),
//                 {
//                     expiresIn: config.get("JWT_ACCESS_TIME")
//                 },
//             )
//             console.log('accessToken :->', accessToken);

//             const data = {
//                 userId: payload._id,
//                 email: payload.email
//             }
//             const refreshToken = generateRefreshToken(data)
//             console.log(refreshToken, 2222);

//             let tokens = {
//                 accessToken: accessToken,
//                 refreshToken: refreshToken
//             }
//             return tokens;
//         }
//     } catch (error) {
//         console.log('error',error);
//         // return res.status(409).json({
//         //     error: error
//         // })
//     }
// }

// const generateRefreshToken = async (payload: any) => {
//     if (payload) {
//         const refreshToken = jwt.sign({

//             userId: payload._id,
//             email: payload.email
//         },
//             JSON.stringify(config.get("JWT_REFRESH_SECRET")),
//             {
//                 expiresIn: config.get("JWT_REFRESH_TIME")
//             },

//         )
//         return refreshToken;
//         // console.log(refreshToken,1111222222);
//     }

// }

const getAccessTokenPromise = async (oldToken: any, req: Request) => {
    return new Promise((resolve, reject) => {
        jwt.verify(oldToken, config.get("JWT_REFRESH_SECRET"), async (err: any, user: any) => {
            if (err) {
                return reject({ status: 403 });
            } else {
                const uniqueUserKey = aes.decrypt(user.sub, config.get("OUTER_KEY_PAYLOAD"))

                let tokens: [] = await redisClient.lrange(uniqueUserKey, 0, -1)
                let token_ = tokens.find(value => JSON.parse(value).refreshToken.toString() == oldToken.toString())

                if (!token_) return reject({ error: validateString.INVALID_TOKEN, status: 403 });

                let index = tokens.findIndex(value => JSON.parse(value).refreshToken.toString() == oldToken.toString())

                let payload = aes.encrypt(uniqueUserKey.toString(), config.get("OUTER_KEY_PAYLOAD"))

                const accessToken = jwt.sign({ sub: payload }, config.get("JWT_ACCESS_SECRET"), { expiresIn: config.get("JWT_ACCESS_TIME") });
                const refreshToken = await generateRefreshToken(payload);

                let data = { accessToken: accessToken, refreshToken: refreshToken }

                await redisClient.lset(uniqueUserKey.toString(), index, JSON.stringify(data));

                return resolve({ accessToken, refreshToken })
            }
        })
    })
}

const getAccessToken = async (req: any, res: Response, payload: any) => {
    const tokens_ = req.headers?.authorization?.split(' ') ?? []
    if (tokens_.length <= 1) {
        return commonutils.sendError(req, res, { message: validateString.INVALID_TOKEN }, 409);
    }
    const oldToken = tokens_[1];
    getAccessTokenPromise(oldToken, req).then((result: any) => {
        const { refreshToken, accessToken } = result
        res.cookie("accessToken", accessToken, { maxAge: 900000, httpOnly: true });
        res.cookie("refreshToken", refreshToken, { maxAge: 900000, httpOnly: true });
        return commonutils.sendSuccess(req, res, {}, 200);
    })
}

const generateRefreshToken = async (payload: string) => {
    return jwt.sign({ sub: payload }, config.get("JWT_REFRESH_SECRET"), { expiresIn: config.get("JWT_REFRESH_TIME") });
}

export default {
    getAccessToken,
    getAccessTokenPromise,
    generateRefreshToken
}