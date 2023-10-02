import mongoose, { ObjectId } from "mongoose";
import auth from "../../middleware/auth";
import { validateString } from "../../utils/AppString";
import commonutils from "../../utils/commonutils";
import redisClient from "../../utils/redisHelper";
import aes from "../../utils/aes";
import express, { NextFunction, Request, Response } from "express";

const userSchema = require('./userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const config = require('config')

async function register(req: any, res: any) {
    const { email } = req.body;
    const findEmail = await userSchema.findOne({ email });
    if (findEmail) {
        return commonutils.sendError(req, res, { message: validateString.EMAIL_EXISTS }, 422);
    }
    try {
        const user = new userSchema({
            first_name: req.body?.first_name,
            last_name: req.body?.last_name,
            email: req.body?.email,
            password: req.body?.password,
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();
        return commonutils.sendSuccess(req, res, { data: user, message: validateString.USER_REGISTERED_SUCCESSFULLY }, 200)
    } catch (err) {
        return commonutils.sendError(req, res, { error: err }, 409);
    }

}

async function login(req: any, res: any) {
    const { email, password } = req.body
    const user = await userSchema.findOne({ email })

    if (!user) {
        return commonutils.sendError(req, res, { message: validateString.VALID_EMAIL }, 422)
    }

    const valid_pass = await bcrypt.compare(password, user.password)

    if (!valid_pass) {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        return commonutils.sendError(req, res, { message: validateString.INCORRECT_PASS }, 422)
    }

    let uniqueUserKey = aes.encrypt(
        JSON.stringify({
            "userId": user._id,
            "createdAt": user.createdAt
        }), config.get("OUTER_KEY_USER"))

    let payload = await aes.encrypt(uniqueUserKey, config.get("OUTER_KEY_PAYLOAD"))

    const accessToken = jwt.sign({ sub: payload }, config.get("JWT_ACCESS_SECRET"), { expiresIn: config.get("JWT_ACCESS_TIME") });
    const refreshToken = await auth.generateRefreshToken(user);

    let data = { accessToken: accessToken, refreshToken: refreshToken }
    console.log('data', data);

    await redisClient.lpush(user.toString(), JSON.stringify(data));
    res.cookie("accessToken", data.accessToken, { maxAge: 900000, httpOnly: true });
    res.cookie("refreshToken", data.refreshToken, { maxAge: 900000, httpOnly: true });

    return commonutils.sendSuccess(req, res, { accessToken: accessToken, refreshToken: refreshToken }, 200)
}

async function registeredUserList(req: any, res: any) {
    const userList = await userSchema.find().select('-password -updatedAt -__v');
    return commonutils.sendSuccess(req, res, { result: userList }, 200)
}

const logout = async (req: any, res: Response) => {
    const tokens_ = req.headers?.authorization?.split(' ') ?? []
    if (tokens_.length <= 1) {
        return commonutils.sendError(req, res, { message: validateString.INVALID_TOKEN }, 409);
    }
    const token = tokens_[1];
    var decoded = jwt.decode(token);
    if (!decoded?.sub) {
        return commonutils.sendError(req, res, { message: validateString.INVALID_TOKEN }, 409);
    }

    const uniqueUserKey = aes.decrypt(decoded.sub, config.get("OUTER_KEY_PAYLOAD"))
    let tokens: [] = await redisClient.lrange(uniqueUserKey.toString(), 0, -1)
    let index = tokens.findIndex(value => JSON.parse(value).accessToken.toString() == token.toString())

    // remove the refresh token and // blacklist current access token
    await redisClient.lrem(uniqueUserKey.toString(), 1, await redisClient.lindex(uniqueUserKey.toString(), index));
    await redisClient.lpush('BL_' + uniqueUserKey.toString(), token);

    return commonutils.sendSuccess(req, res, { message: validateString.LOGOUT_SUCCESSFULLY }, 200);
}

async function update(req: any, res: any) {
    const { user_id, email, first_name, last_name } = req.body;

    const user = await userSchema.find({ _id: new mongoose.Types.ObjectId(user_id) });
    if (!user)
        return commonutils.sendError(req, res, { message: validateString.USER_NOT_FOUND });

    const update = await userSchema.findByIdAndUpdate({ _id: new mongoose.Types.ObjectId(user_id) }, { first_name, last_name, email });
    return commonutils.sendSuccess(req, res, { result: update }, 200)
}

async function userDelete(req: any, res: any) {
    const { user_id } = req.body;
    const user = await userSchema.find({ _id: new mongoose.Types.ObjectId(user_id) });
    if (!user)
        return commonutils.sendError(req, res, { message: validateString.USER_NOT_FOUND });

    await userSchema.deleteOne(new mongoose.Types.ObjectId(user_id));
    return commonutils.sendSuccess(req, res, { message: validateString.USER_DELETE_SUCCESSFULLY });
}

export default {
    register,
    login,
    registeredUserList,
    logout,
    update,
    userDelete
}