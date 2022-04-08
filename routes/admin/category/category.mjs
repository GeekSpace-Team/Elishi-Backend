import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { badRequest, response } from '../../../modules/response.mjs';
import {db} from '../../../modules/database/connection.mjs';
import { addCategory, deleteCategory, deleteCategoryImage, getCategory, updateCategory, updateCategoryWithImage } from '../../../modules/constant/admin_query.mjs';
import multer from 'multer';

import fs from 'fs';


const folder = 'public/uploads/category';

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

const router = express.Router();

router.post('/add-category',verifyToken,checkFolder, upload.single('file'),(req,res)=>{
    if(req.body==null || Object.keys(req.body).length==0){
        badRequest(req, res);
    } else{
        const{nameTM,nameRU,nameEN,status,isMain} = req.body;
        const image = req.file.destination + "/" + req.file.filename;
        db.query(addCategory,[nameTM,nameRU,nameEN,status,isMain,image])
        .then(result=>{
            if(result.rows.length){
                res.send(response(false,"success",result.rows));
                res.end();
            } else {
                badRequest(req, res);
            }
        })
        .catch(err=>{
            badRequest(req, res);
        })
    }
});

router.get('/get-category',verifyToken,(req, res)=>{
    db.query(getCategory)
    .then(result=>{
        if(result.rows.length){
            res.send(response(false,"success",result.rows));
            res.end();
        } else {
            res.send(response(false,"success",[]));
            res.end();
        }
    })
    .catch(err=>{
        badRequest(req, res);
    })
})

router.delete('/delete-category/:id',verifyToken,(req, res)=>{
    if(req.params.id){
        if(req.query.filename){
            fs.unlink(req.query.filename,(err, data) => {});
        }
        db.query(deleteCategory,[req.params.id])
        .then(result=>{
            if(result){
                res.send(response(false,"success","success"));
                res.end();
            }
        })
        .catch(err=>{
            badRequest(req, res);
        })
    } else {
        badRequest(req, res);
    }
})

router.put('/update-category',upload.single('file'),verifyToken,(req, res)=>{
    if(req.body==null || Object.keys(req.body).length==0){
        badRequest(req, res);
    } else{
        const{id,nameTM,nameRU,nameEN,status,isMain} = req.body;
        let image = '';
        if(req.file){
            db.query(deleteCategoryImage,[id])
            .then(response=>{
                if(response.rows.length){
                    fs.unlink(response.rows[0].image,()=>{})
                }
            })
            .catch(error => {});
            image=req.file.destination + "/" + req.file.filename;
            db.query(updateCategoryWithImage,[nameTM,nameRU,nameEN,status,isMain,image,id])
            .then(result=>{
                if(result.rows.length){
                    res.send(response(false,"success",result.rows));
                    res.end();
                } else {
                    badRequest(req, res);
                }
            })
            .catch(err=>{
                badRequest(req, res);
            })

        } else {
            db.query(updateCategory,[nameTM,nameRU,nameEN,status,isMain,id])
            .then(result=>{
                if(result.rows.length){
                    res.send(response(false,"success",result.rows));
                    res.end();
                } else {
                    badRequest(req, res);
                }
            })
            .catch(err=>{
                badRequest(req, res);
            })
        }
    }
})

export const categoryRouter = router;