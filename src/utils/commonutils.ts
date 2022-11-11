
const sendSuccessResponse = (req:any,res:any,data:any,statusCode:200) => {
    return res.status(statusCode).json(data);
}
const sendErrorResponse =(req:any,res:any,data:any,statusCode:422)=>{
    return res.status(statusCode).json(data);
}

const sendError = (req:any,res:any,data:any,statusCode:409)=>{
 return res.status(statusCode).json(data);
}
export default {
    sendSuccessResponse,
    sendErrorResponse,
    sendError
}