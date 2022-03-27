import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { addVars, deleteVars, getVars, updateVars } from '../../../modules/constant/admin_query.mjs';
import {db} from '../../../modules/database/connection.mjs';
import { badRequest, response } from '../../../modules/response.mjs';


const router = express.Router();
router.post('/add-var',verifyToken,(req, res) => {
    const{type,value}=req.body;
    db.query(addVars,[type,value])
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
    });
})


router.get('/get-vars',verifyToken,(req,res)=>{
    db.query(getVars)
    .then(result=>{
        res.json(response(false,"success",result.rows));
        res.end();
    })
    .catch(err=>{
        badRequest(req,res);
    })
})


router.delete('/delete-vars/:id',verifyToken,(req,res)=>{
    if(typeof req.params.id !== 'undefined'){
        db.query(deleteVars,[req.params.id])
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

router.put('/update-var',verifyToken,(req, res) => {
    const{value,type}=req.body;
    db.query(updateVars,[value,type])
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
    });
})

export const varsRouter = router;