import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { addHoliday, deleteHoliday, getHoliday, updateHoliday } from '../../../modules/constant/admin_query.mjs';
import {db} from '../../../modules/database/connection.mjs';
import { badRequest,response } from '../../../modules/response.mjs';


const holidayRouter = express.Router();

holidayRouter.post('/add-holiday',verifyToken,(req, res) => {
    if(typeof req.body !== 'undefined'){
        const{nameTM,nameRU,nameEN} = req.body;
        if(typeof nameTM === 'undefined' || typeof nameRU === 'undefined' || typeof nameEN === 'undefined'){
            badRequest(req, res);
            return;
        }
        db.query(addHoliday,[nameTM,nameRU,nameEN])
        .then(result=>{
            if(result.rows.length){
                res.json(response(false,"success",result.rows));
                res.end();
            } else {
                badRequest(req, res);
            }
        })
        .catch(err => {
            badRequest(req, res);
        })
    } else {
        badRequest(req,res);
    }
});


holidayRouter.get('/get-holiday',verifyToken,(req, res) => {
    db.query(getHoliday)
    .then(result=>{
        res.json(response(false,"success",result.rows));
        res.end();
    })
    .catch(err => {
        badRequest(req, res);
    })
})

holidayRouter.delete('/delete-holiday/:id',verifyToken,(req, res) =>{
    if(typeof req.params.id !== "undefined"){
        db.query(deleteHoliday,[req.params.id])
        .then(result=>{
            res.json(response(false,"success",null));
            res.end();
        })
        .catch(err=>{
            badRequest(req, res);
        })
    } else {
        badRequest(req, res);
    }
})


holidayRouter.put('/update-holiday',verifyToken,(req, res) => {
    if(typeof req.body !== 'undefined'){
        const{nameTM,nameRU,nameEN,id} = req.body;
        if(typeof nameTM === 'undefined' || typeof nameRU === 'undefined' || typeof nameEN === 'undefined' || typeof id === 'undefined'){
            badRequest(req, res);
            return;
        }
        db.query(updateHoliday,[nameTM,nameRU,nameEN,id])
        .then(result=>{
            if(result.rows.length){
                res.json(response(false,"success",result.rows));
                res.end();
            } else {
                badRequest(req, res);
            }
        })
        .catch(err => {
            badRequest(req, res);
        })
    } else {
        badRequest(req,res);
    }
});


export {holidayRouter};