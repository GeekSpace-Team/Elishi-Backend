import express from 'express';
import multer from 'multer';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { add_sub_category_query, deleteSubCategory, deleteSubCategoryImage, get_sub_category_without_condition, get_sub_category_with_condition, updateSubCategoryWithImage, updateSubCategoryWithoutImage } from '../../../modules/constant/admin_query.mjs';
import { db } from '../../../modules/database/connection.mjs';
import { badRequest, response } from '../../../modules/response.mjs';
import fs from 'fs';


const folder = 'public/uploads/sub-category';

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
const router = express.Router();

const checkFolder = (req, res, next) => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
    next();
}

router.post('/add-sub-category', verifyToken, checkFolder, upload.single('file'), (req, res) => {
    const { nameTM, nameRU, nameEN, status, category } = req.body;
    const image = req.file.destination + "/" + req.file.filename;
    db.query(add_sub_category_query, [nameTM, nameRU, nameEN, category, status, image])
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


router.get('/get-sub-category', verifyToken, (req, res) => {
    if (req.query.category_id) {
        db.query(get_sub_category_with_condition, [req.query.category_id])
        .then(result => {
            res.send(response(false, "success", result.rows));
            res.end();
        })
        .catch(error => {
            badRequest(req, res);
        })
    } else{
        db.query(get_sub_category_without_condition)
        .then(result => {
            res.send(response(false, "success", result.rows));
            res.end();
        })
        .catch(error => {
            badRequest(req, res);
        })
    }
    
})

router.delete('/delete-sub-category/:id',verifyToken,(req, res)=>{
    if(req.params.id){
        if(req.query.filename){
            fs.unlink(req.query.filename,(err, data) => {});
        }
        db.query(deleteSubCategory,[req.params.id])
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

const updateSubCategory = (req, res) => {
    let image = '';
    const { id,nameTM, nameRU, nameEN, status, category } = req.body;
    if(req.file){
        db.query(deleteSubCategoryImage,[id])
        .then(response=>{
            if(response.rows.length){
                fs.unlink(response.rows[0].image,()=>{

                })
            }
        })
        .catch(error => {

        });
        image=req.file.destination + "/" + req.file.filename;
        db.query(updateSubCategoryWithImage,[nameTM, nameRU, nameEN,category , status, image,id])
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
        db.query(updateSubCategoryWithoutImage,[nameTM, nameRU, nameEN, category, status,id])
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

router.put('/update-sub-category',verifyToken, upload.single('file'), updateSubCategory)



export const subCategoryRouter = router;

