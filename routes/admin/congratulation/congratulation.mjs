import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { addCongratulation, deleteCongratulations, getCongratulationWithCondition, getCongratulationWithConditionCount, getCongratulationWithoutCondition, getCongratulationWithoutConditionCount, updateCongratulations } from '../../../modules/constant/admin_query.mjs';
import {db} from '../../../modules/database/connection.mjs';
import { badRequest, response } from '../../../modules/response.mjs';


const router = express.Router();

router.post('/add-congratulation',verifyToken,(req, res) => {
    const{title,holiday,user,status,text} = req.body;
    db.query(addCongratulation,[text,status,user,holiday,title])
    .then(result=>{
        if(result.rows.length){
            res.json(response(false,"success",result.rows));
            res.end();
        } else {
            badRequest(req,res);
        }
    })
    .catch(err => {
        badRequest(req,res);
    })
})

router.get('/get-congratulation',verifyToken,(req, res) => {
    let query = getCongratulationWithoutCondition;
    let values = [req.query.limit,req.query.page];
    let count_query = getCongratulationWithoutConditionCount;
    let count_values = [];
    if(typeof req.query.holiday !== 'undefined' && req.query.holiday!=""){
        query = getCongratulationWithCondition;
        values = [req.query.holiday,req.query.limit,req.query.page];
        count_query = getCongratulationWithConditionCount;
        count_values = [req.query.holiday];
    }

    if(req.query.page==1){
        db.query(count_query,count_values)
        .then(result2=>{
            db.query(query, values)
            .then(result=>{
                let page_count = Math.round(result2.rows[0].page_count/req.query.limit);
                if(page_count <= 0){
                    page_count = 1;
                }
                res.json(response(false,"success",{congratulations:result.rows,page_count:page_count}));
                res.end();
            })
            .catch(err=>{
                badRequest(req,res);
            })
        })
        .catch(err=>{
            badRequest(req,res);
        })
    } else {
        db.query(query, values)
        .then(result=>{
            res.json(response(false,"success",{congratulations:result.rows}));
            res.end();
        })
        .catch(err=>{
            badRequest(req,res);
        })
    }
})

router.delete('/delete-congratulation/:id',verifyToken,(req, res)=>{
    if(typeof req.params.id !== 'undefined'){
        db.query(deleteCongratulations,[req.params.id])
        .then(result=>{
            res.json(response(false,"success",null));
            res.end();
        })
        .catch(err=>{
            badRequest(req,res);
        })
    } else {
        badRequest(req, res);
    }
})

router.put('/update-congratulation',verifyToken,(req, res) => {
    const{title,holiday,user,status,text,id} = req.body;
    db.query(updateCongratulations,[text,status,user,holiday,title,id])
    .then(result=>{
        if(result.rows.length){
            res.json(response(false,"success",result.rows));
            res.end();
        } else {
            badRequest(req,res);
        }
    })
    .catch(err => {
        badRequest(req,res);
    })
})


export const congratulationRouter = router;