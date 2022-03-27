import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { addConstant, deleteConstants, getConstants, updateConstant } from '../../../modules/constant/admin_query.mjs';
import {db} from '../../../modules/database/connection.mjs';
import { badRequest,response } from '../../../modules/response.mjs';


const constantRouter = express.Router();
constantRouter.post('/add-constant',verifyToken,(req, res) => {
    const{titleTM,titleRU,titleEN,lightTM,lightRU,lightEN,darkTM,darkRU,darkEN,type} = req.body;
    db.query(addConstant,[titleTM,titleRU,titleEN,lightTM,lightRU,lightEN,darkTM,darkRU,darkEN,type])
    .then(result=>{
        if(result.rows.length){
            res.json(response(false,"success",result.rows));
            res.end();
        } else {
            badRequest(req, res);
        }
    })
    .catch(err => {
        badRequest(req,res);
    })
})

constantRouter.get('/get-constant',verifyToken,(req,res)=>{
    db.query(getConstants)
    .then(result=>{
        res.json(response(false,"success",result.rows));
        res.end();
    })
    .catch(err => {
        badRequest(req, res);
    })
})

constantRouter.delete('/delete-constant/:id',verifyToken,(req,res)=>{
    if(typeof req.params.id !== 'undefined'){
        db.query(deleteConstants,[req.params.id])
        .then(result=>{
            res.json(response(false,"success",null));
            res.end();
        })
        .catch(err => {
            badRequest(req, res);
        })
    } else {
        badRequest(req, res);
    }
})

constantRouter.put('/update-constant',verifyToken,(req, res) => {
    const{titleTM,titleRU,titleEN,lightTM,lightRU,lightEN,darkTM,darkRU,darkEN,type,id} = req.body;
    db.query(updateConstant,[titleTM,titleRU,titleEN,lightTM,lightRU,lightEN,darkTM,darkRU,darkEN,type,id])
    .then(result=>{
        if(result.rows.length){
            res.json(response(false,"success",result.rows));
            res.end();
        } else {
            badRequest(req, res);
        }
    })
    .catch(err => {
        badRequest(req,res);
    })
})
export {constantRouter};