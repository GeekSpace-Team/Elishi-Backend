import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import fs from 'fs';
import multer from 'multer';
import { db } from '../../../modules/database/connection.mjs';
import { addAdsQuery, deleteAdsImage, deleteAdsQuery, getAdsQuery, updateAdsWithImage, updateAdsWithoutImage } from '../../../modules/constant/admin_query.mjs';
import { badRequest,response } from '../../../modules/response.mjs';

const router = express.Router();

const folder = 'public/uploads/ads';

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


router.post('/add-ads',verifyToken,checkFolder,upload.single('ads_image'),(req,res)=>{
    const{constant_id,site_url,status}=req.body;
    const image = req.file.destination + "/" + req.file.filename;
    db.query(addAdsQuery,[image,constant_id,site_url,status])
    .then(result=>{
        if(result.rows.length){
            res.json(response(false,"success",result.rows));
            res.end();
        } else {
            badRequest(req,res);
        }
    })
    .catch(err=>{
        badRequest(req,res);
    })
});


router.get('/get-ads',verifyToken,(req,res)=>{
    db.query(getAdsQuery)
    .then(result=>{
        res.json(response(false,"success",result.rows));
        res.end();
    })
    .catch(err=>{
        badRequest(req,res);
    })
});


router.delete('/delete-ads/:id',verifyToken,(req,res)=>{
    const id = req.params.id;
    const image = req.query.image;
    fs.unlink(image,(err, data) => {});
    db.query(deleteAdsQuery,[id])
    .then(result=>{
        res.send(response(false,"success",result.rows));
        res.end();
    })
    .catch(err=>{
        res.json(err+"")
    })
})


const updateAds =(req,res)=>{
    let image = '';
    const { id, constant_id, site_url,status} = req.body;
    if(req.file){
        db.query(deleteAdsImage,[id])
        .then(response=>{
            if(response.rows.length){
                fs.unlink(response.rows[0].ads_image,()=>{})
            }
        })
        .catch(error => {});
        image=req.file.destination + "/" + req.file.filename;
        db.query(updateAdsWithImage,[image, constant_id, site_url,status,id])
        .then(result=>{
            if(result.rows.length){
                res.send(response(false, "success", result.rows));
                res.end();
            } else{
                badRequest(req, res);
            }
        })
        .catch(err => {
            badRequest(req, res);
        })
    } else {
        db.query(updateAdsWithoutImage,[constant_id, site_url,status,id])
        .then(result=>{
            if(result.rows.length){
                res.send(response(false, "success", result.rows));
                res.end();
            } else{
                badRequest(req, res);
            }
        })
        .catch(err => {
            badRequest(req, res);
        })
    }
}

router.put('/update-ads',verifyToken, upload.single('file'), updateAds);




export const adsRouter = router;