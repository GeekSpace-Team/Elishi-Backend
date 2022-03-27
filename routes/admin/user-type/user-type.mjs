import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { addUserType, deleteUserType, getUserType, updateUserType } from '../../../modules/constant/admin_query.mjs';
import {db} from '../../../modules/database/connection.mjs';
import { badRequest, response } from '../../../modules/response.mjs';

const userTypeRouter = express.Router();

userTypeRouter.post('/add-user-type',verifyToken,(req,res) => {
    const{user_type,product_limit}=req.body;
    db.query(addUserType,[user_type,product_limit])
    .then(result=>{
        if(result.rows.length){
            res.json(response(false,"success",result.rows));
            res.end();
        } else {
            badRequest(req, res);
        }
    })
    .catch(err=>{
        badRequest(req,res);
    })
})

userTypeRouter.get('/get-user-type',verifyToken,(req,res)=>{
    db.query(getUserType)
    .then(result=>{
        res.json(response(false,"success",result.rows));
        res.end();
    })
    .catch(err=>{
        badRequest(req,res);
    })
})

userTypeRouter.delete('/delete-user-type/:id',verifyToken,(req,res)=>{
    if(typeof req.params.id !== 'undefined'){
        db.query(deleteUserType,[req.params.id])
        .then(result=>{
            res.json(response(false,"success",null));
            res.end();
        })
        .catch(err=>{
            badRequest(req,res);
        })
    } else {
        badRequest(req,res);
    }
})

userTypeRouter.put('/update-user-type',verifyToken,(req,res) => {
    const{user_type,product_limit,id}=req.body;
    db.query(updateUserType,[user_type,product_limit,id])
    .then(result=>{
        if(result.rows.length){
            res.json(response(false,"success",result.rows));
            res.end();
        } else {
            badRequest(req, res);
        }
    })
    .catch(err=>{
        badRequest(req,res);
    })
})

export {userTypeRouter}; 