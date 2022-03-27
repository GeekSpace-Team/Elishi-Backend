import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { badRequest, response } from '../../../modules/response.mjs';
import {db} from '../../../modules/database/connection.mjs';
import { addCategory, deleteCategory, getCategory, updateCategory } from '../../../modules/constant/admin_query.mjs';

const router = express.Router();

router.post('/add-category',verifyToken,(req,res)=>{
    if(req.body==null || Object.keys(req.body).length==0){
        badRequest(req, res);
    } else{
        const{nameTM,nameRU,nameEN,status,isMain} = req.body;
        db.query(addCategory,[nameTM,nameRU,nameEN,status,isMain])
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

router.put('/update-category',verifyToken,(req, res)=>{
    if(req.body==null || Object.keys(req.body).length==0){
        badRequest(req, res);
    } else{
        const{id,nameTM,nameRU,nameEN,status,isMain} = req.body;
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
})

export const categoryRouter = router;