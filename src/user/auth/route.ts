import authController from "./authController";


const app = require('express');
const router = app.Router()


router.post('/register',authController.register);
router.post('/login',authController.login);

module.exports = router
