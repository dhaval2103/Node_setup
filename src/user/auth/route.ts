import authController from "./authController";
const auth = require('../../middleware/validateToken');

const app = require('express');
const router = app.Router()

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/userList', auth, authController.registeredUserList)
router.put('/update', auth, authController.update)
router.delete('/delete', auth, authController.userDelete)
router.post('/logout', auth, authController.logout)

module.exports = router
