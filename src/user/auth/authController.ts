import { validateString } from "../../utils/appValidate";
import commonutils from "../../utils/commonutils";

const userSchema = require('./userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')
const config = require('config')

async function register(req: any, res: any) {
    const { email } = req.body;
    const findEmail = await userSchema.findOne({ email });
    if (findEmail) {
        return commonutils.sendErrorResponse(req, res, { message: validateString.EMAIL_EXISTS }, 422);
    }
    try {
        const user = new userSchema({
            first_name: req.body?.first_name,
            last_name: req.body?.last_name,
            email: req.body?.email,
            password: req.body?.password,
        });
        // has pass
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        await user.save();
        return commonutils.sendSuccessResponse(req, res, { data: user, message: validateString.USER_REGISTERED_SUCCESSFULLY }, 200)
    } catch (err) {
        return commonutils.sendError(req, res, { error: err }, 409);
    }

}

async function login(req: any, res: any) {
    const { email, password } = req.body
    const user = await userSchema.findOne({ email })
    if (!user) {
        return commonutils.sendErrorResponse(req, res, { message: validateString.VALID_EMAIL }, 422)
    }
    const valid_pass = await bcrypt.compare(password, user.password)
    if (!valid_pass) {
        return commonutils.sendErrorResponse(req, res, { message: validateString.INCORRECT_PASS }, 422)
    }
    try {
        if (user) {
            const accessToken = jwt.sign(
                {
                    userId: user._id,
                    email
                },
                JSON.stringify(config.get("JWT_ACCESS_SECRET")),
                {
                    expiresIn: config.get("JWT_ACCESS_TIME")
                }
            );

            await userSchema.updateOne(
                { _id: user._id },
                {
                    $set: {
                        accessToken: accessToken
                    }
                },
            )
            res.cookie('accessToken', accessToken);
        }
        return commonutils.sendSuccessResponse(req, res, { data: user, message: validateString.LOGIN_SUCCESSFULLY }, 200)
    } catch (error) {
        return commonutils.sendError(req, res, { error: error }, 409);
    }
}

async function registeredUserList(req: any, res: any) {
    const userList = await userSchema.find();
    return commonutils.sendSuccessResponse(req, res, { result: userList }, 200)
}

async function logout(req: any, res: any) {
    const token_ = req.headers?.authorization?.split(' ')[1] ?? []
    var decoded = jwt.decode(token_);
    // console.log(decoded,222);



}

export default {
    register,
    login,
    registeredUserList,
    logout
}