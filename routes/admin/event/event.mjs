import express from 'express';
import multer from 'multer';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { addEvent, addProductToEvent, add_sub_category_query, deleteEvent, deleteEventImage, deleteSubCategory, deleteSubCategoryImage, getEventProducts, getEvents, get_sub_category_without_condition, get_sub_category_with_condition, removeProductFromEvent, updateEvent, updateEventWithoutImage, updateSubCategoryWithImage, updateSubCategoryWithoutImage } from '../../../modules/constant/admin_query.mjs';
import { db } from '../../../modules/database/connection.mjs';
import { badRequest, response } from '../../../modules/response.mjs';
import fs from 'fs';
import format from 'pg-format';


const folder = 'public/uploads/event';

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

router.post('/add-event', verifyToken, checkFolder, upload.single('file'), (req, res) => {
    const { titleTM, titleRU, titleEN, status, isMain,url,event_type,go_id } = req.body;
    let image = '';
    if(typeof req.file !== 'undefined'){
        image = req.file.destination + "/" + req.file.filename;
    }
    db.query(addEvent, [titleTM, titleRU, titleEN,image, url, isMain,status,event_type,go_id ])
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


router.get('/get-event', verifyToken, (req, res) => {
    
        db.query(getEvents)
        .then(result => {
            res.send(response(false, "success", result.rows));
            res.end();
        })
        .catch(error => {
            badRequest(req, res);
        })
    
    
})

router.delete('/delete-event/:id',verifyToken,(req, res)=>{
    if(req.params.id){
        if(req.query.filename){
            fs.unlink(req.query.filename,(err, data) => {});
        }
        db.query(deleteEvent,[req.params.id])
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

const updateEventFun = (req, res) => {
    let image = '';
    const { id,titleTM, titleRU, titleEN, url, isMain,status,event_type,go_id  } = req.body;
    if(req.file){
        db.query(deleteEventImage,[id])
        .then(response=>{
            if(response.rows.length){
                fs.unlink(response.rows[0].event_image,()=>{})
            }
        })
        .catch(error => {

        });
        image=req.file.destination + "/" + req.file.filename;
        db.query(updateEvent,[titleTM, titleRU, titleEN,image, url, isMain,status,event_type,go_id,id ])
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
        db.query(updateEventWithoutImage,[titleTM, titleRU, titleEN, url, isMain,status,event_type,go_id,id ])
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

router.put('/update-event',verifyToken, upload.single('file'), updateEventFun)

router.post('/add-product-to-event',verifyToken,(req,res) => {
    const{event_id,produscts} = req.body;
    let values = [];
    for(let i=0; i<produscts.length; i++) {
        values.push([produscts[i], 'now()', 'now()', event_id]);
    }
    db.query(format(addProductToEvent,values))
    .then(result=>{
        if(result.rows.length){
            res.json(response(false,"success",result.rows));
        } else {
            badRequest(req, res);
        }
    })
    .catch(err=>{
        badRequest(req, res);
    })
});


router.get('/get-event-product',verifyToken,(req, res)=>{
    const{event_id} = req.query;
    db.query(getEventProducts,[event_id])
    .then(result=>{
        res.json(response(false, "success", result.rows));
    })
    .catch(err=>{
        badRequest(req, res);
    })
})


router.delete('/delete-event-products/:id',verifyToken,(req, res)=>{
    const {id} = req.params;
        db.query(removeProductFromEvent,[id])
        .then(result=>{
            res.json(response(false, "success", result.rows));
        })
        .catch(err=>{
            res.send(err+"");
        })
})

export const eventRouter = router;

