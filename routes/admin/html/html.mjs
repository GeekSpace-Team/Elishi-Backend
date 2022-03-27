import express from 'express';
import multer from 'multer';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { badRequest,response } from '../../../modules/response.mjs';
import fs from 'fs';

const router = express.Router();

const folder = 'public/uploads/html';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, folder)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + ".png")
    }
})

const upload = multer({ storage: storage });

const checkFolder = (req, res, next) => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
    next();
}

router.post('/upload-image',verifyToken,checkFolder,upload.single('image'),(req, res) => {
    if(req.file!=null){
        const image = req.file.destination + "/" + req.file.filename;
        res.json(response(false,"success",{image:image}));
    } else {
        badRequest(req,res);
    }
})

export const htmlRouter = router;