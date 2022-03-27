import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { addRegion, deleteRegion, getRegion, updateRegion } from '../../../modules/constant/admin_query.mjs';
import {db} from '../../../modules/database/connection.mjs';
import { badRequest, response } from '../../../modules/response.mjs';


const regionRouter = express.Router();
regionRouter.post('/add-region',verifyToken,(req,res) => {
    const{region_name_tm,region_name_ru,region_name_en} = req.body;
    db.query(addRegion,[region_name_tm,region_name_ru,region_name_en])
    .then(result=>{
        if(result.rows.length){
            res.json(response(false, "success",result.rows));
            res.end();
        } else {
            badRequest(req,res);
        }
    })
    .catch(err=>{
        badRequest(req,res);
    })
});


regionRouter.get('/get-region',verifyToken,(req,res)=>{
    db.query(getRegion)
    .then(result=>{
        res.json(response(false,"success",result.rows));
        res.end();
    })
    .catch(err=>{
        badRequest(req,res);
    })
})

regionRouter.delete('/delete-region/:id',verifyToken,(req,res)=>{
    if(typeof req.params.id !== 'undefined'){
        db.query(deleteRegion,[req.params.id])
        .then(result=>{
            res.json(response(false, "success",null));
            res.end();
        })
        .catch(err=>{
            badRequest(req,res);
        })
    } else {
        badRequest(req, res);
    }
});


regionRouter.put('/update-region',verifyToken,(req,res) => {
    const{id,region_name_tm,region_name_ru,region_name_en} = req.body;
    db.query(updateRegion,[region_name_tm,region_name_ru,region_name_en,id])
    .then(result=>{
        if(result.rows.length){
            res.json(response(false, "success",result.rows));
            res.end();
        } else {
            badRequest(req,res);
        }
    })
    .catch(err=>{
        badRequest(req,res);
    })
});

export {regionRouter};