import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import multer from 'multer';
import fs from 'fs';
import { addBanner, deleteBanner, getBanner,deleteBannerImage,updateBanner } from '../../../modules/constant/admin_query.mjs';
import { db } from '../../../modules/database/connection.mjs';
import { badRequest, response } from '../../../modules/response.mjs';

const folder = 'public/uploads/banner';
const checkFolder = (req, res, next) => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
    next();
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, folder)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + ".png")
    }
  })
  
const upload = multer({ storage: storage })
const router = express.Router();
const uploader = upload.fields([{ name:'file_tm',maxCount:1},{ name:'file_ru',maxCount:1},{ name:'file_en',maxCount:1}]);
router.post('/add-banner',
            verifyToken,
            checkFolder,
            uploader,
            (req,res) => {
                const { order, status,siteURL } = req.body;
                const image_tm = req.files.file_tm[0].destination + "/" + req.files.file_tm[0].filename;
                const image_en = req.files.file_en[0].destination + "/" + req.files.file_en[0].filename;
                const image_ru = req.files.file_ru[0].destination + "/" + req.files.file_ru[0].filename;
                db.query(addBanner, [image_tm, image_ru, image_en,order, status,siteURL])
                    .then(result => {
                        if (result.rows.length) {
                            res.send(response(false, "success", result.rows));
                            res.end();
                        } else {
                            badRequest(req, res);
                        }
                    })
                    .catch(error => {
                        badRequest(req, res);
                    })
            });

router.get('/getBanner',verifyToken,(req,res) => {
    db.query(getBanner)
    .then(result=>{
        res.send(response(false,"success",result.rows));
        res.end();
    })
    .catch(err => {
        badRequest(req, res);
    })
})


router.delete('/delete-banner/:id',verifyToken,(req,res)=>{
    const id= req.params.id;
    if(id){
        db.query(deleteBannerImage,[id])
        .then(result => {
            fs.unlink(result.rows[0].banner_image_tm,(err, data) => {});
            fs.unlink(result.rows[0].banner_image_ru,(err, data) => {});
            fs.unlink(result.rows[0].banner_image_en,(err, data) => {});
        })
        .catch(err =>{

        })
        db.query(deleteBanner,[id])
        .then(result=>{
            res.send(response(false, "success", null));
            res.end();
        })
    } else{
        badRequest(req, res);
    }
})

const checkFiles = (req, res,next) => {
    db.query(deleteBannerImage, [req.body.id])
    .then(result=>{
        req.oldImage = result.rows[0];
        next();
    })
    .catch(err => {
        next();
    })
}

router.put('/update-banner',
            verifyToken,
            checkFolder,
            uploader,
            checkFiles,
            (req,res) => {
                const { id, order, status,siteURL } = req.body;
                let image_tm="";
                let image_ru="";
                let image_en="";
                if(typeof req.oldImage !== "undefined"){
                    image_tm = req.oldImage.banner_image_tm;
                    image_en = req.oldImage.banner_image_en;
                    image_ru = req.oldImage.banner_image_ru;
                }
                if(typeof req.files !== "undefined"){
                     if(typeof req.files.file_tm !== "undefined"){
                         if(req.files.file_tm.length){
                            fs.unlink(image_tm,(err, data) => {});
                            image_tm = req.files.file_tm[0].destination + "/" + req.files.file_tm[0].filename;
                         }
                     }
                     if(typeof req.files.file_en !== "undefined"){
                        if(req.files.file_en.length){
                           fs.unlink(image_en,(err, data) => {});
                           image_en = req.files.file_en[0].destination + "/" + req.files.file_en[0].filename;
                        }
                    }

                    if(typeof req.files.file_ru !== "undefined"){
                        if(req.files.file_ru.length){
                           fs.unlink(image_ru,(err, data) => {});
                           image_ru = req.files.file_ru[0].destination + "/" + req.files.file_ru[0].filename;
                        }
                    }
                     
                }
               
               
                db.query(updateBanner, [image_tm, image_ru, image_en,order, status,siteURL,id])
                    .then(result => {
                        if (result.rows.length) {
                            res.send(response(false, "success", result.rows));
                            res.end();
                        } else {
                            badRequest(req, res);
                        }
                    })
                    .catch(error => {
                        res.send(error);
                    })
            });


export const bannerRouter = router;