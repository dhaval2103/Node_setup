import authController from "./authController";
// import auth from '../../middleware/validateToken';
const auth = require('../../middleware/validateToken');


const app = require('express');
const router = app.Router()

// router.use('/', function (req: any, res: any, next: any) {
//     return router.auth(req, res, next);

// })

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/userList',auth,authController.registeredUserList)
router.post('/logout',auth,authController.logout)



module.exports = router
