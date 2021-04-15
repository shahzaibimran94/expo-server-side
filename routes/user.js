const path = require('path');
const multer = require('multer');
const router = require('express').Router();
const UserController = require('../controllers/user');
const auth_middleware = require('../middleware/auth');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
        const { type } = req.params;
        const UPLOAD_PATH = path.join(__dirname, `../file_storage/${type}`);
        callback(null, UPLOAD_PATH);
    },
    filename: (req, file, callback) => {
      callback(null, file.originalname);
    }
  })
});

router.get('/document/:type', auth_middleware, UserController.access_document);
router.get('/doc/:type/:url', UserController.document_stream);
router.post('/upload/file/:type/:doc_type', [auth_middleware, upload.single('file')], UserController.upload_file);
router.post('/verify', auth_middleware, UserController.verify);
router.delete('/document/:type', auth_middleware, UserController.delete_document);
router.post('/audit', auth_middleware, UserController.audit_trial);
router.put('/modify', auth_middleware, UserController.update_user);

module.exports = router;