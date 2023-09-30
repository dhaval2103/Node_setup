import encryptedData from "../middleware/secure/encryptData";
import decryptedData from "../middleware/secure/decryptData";
import express, { NextFunction, Request, Response } from "express";



async function sendSuccess(req: Request, res: Response, data: any, statusCode = 200) {
    if (req.headers.env === "test") {
        return res.status(statusCode).send(data)
    }

    let encData = await encryptedData.EncryptedData(req, res, data)
    return res.status(statusCode).send(encData)
}


async function sendError(req: Request, res: Response, data: any, statusCode = 422) {
    if (req.headers.env === "test") {
        return res.status(statusCode).send(data)
    }

    // let encData = await encryptedData.EncryptedData(req, res, data)
    return res.status(statusCode).send(data)
}


export default {
    sendSuccess,
    sendError,
}