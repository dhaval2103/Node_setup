import commonutils from "../utils/commonutils";
import { validateString } from "../utils/AppString";
import redisClient from "../utils/redisHelper";
import aes from "../utils/aes";

const jwt = require("jsonwebtoken")
const config = require('config')
import express, { NextFunction, Request, Response } from "express";


async function verifyToken(req: any, res: Response, next: Function) {
    let tokens_ = req.headers?.authorization?.split(' ') ?? []

    return new Promise((resolve, reject) => {
        if (tokens_.length <= 1) {
            reject(validateString.INVALID_TOKEN);
        }
        const token = tokens_[1];
        jwt.verify(token, config.get("JWT_ACCESS_SECRET"), async (err: any, user: any) => {
            if (err) {
                if (err.name == "TokenExpiredError") {
                    reject(validateString.TOKEN_EXPIRED);
                } else {
                    reject(validateString.INVALID_SESSION);
                }
            } else {
                let midLayer = aes.decrypt(user.sub, config.get("OUTER_KEY_PAYLOAD"))
                const userData = JSON.parse(aes.decrypt(midLayer.toString(), config.get("OUTER_KEY_USER")));
                const userObj = { userid: userData.userId, createdAt: userData.createdAt }
                let blackListed: [] = await redisClient.lrange('BL_' + midLayer.toString(), 0, -1)
                let blackListed_ = blackListed.find(value => value == token)

                let tokens: [] = await redisClient.lrange(midLayer.toString(), 0, -1)
                let token_ = tokens.find(value => JSON.parse(value).accessToken.toString() == token.toString())

                if (blackListed_ && !token_) {
                    reject(validateString.BLACKLISTED_TOKEN);
                } else {
                    resolve(userObj);
                }
            }
        })
    }).then((userObj: any) => {
        req.headers.userid = userObj.userid;
        next();
    }).catch((err: any) => {
        return commonutils.sendError(req, res, { message: err }, 409);
    })
}

module.exports = verifyToken;