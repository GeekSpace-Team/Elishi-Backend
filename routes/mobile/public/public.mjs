import express from 'express';
import { verifyTokenWithNext } from '../../../modules/auth/token.mjs';
import { getCategory, getCongratulations, getCongratulationsWithCondition, getConstantByType, getHoliday, getLocations } from '../../../modules/constant/user_queries.mjs';
import { db } from '../../../modules/database/connection.mjs';
import { defaultMessage, message } from '../../../modules/message.mjs';
import { badRequest, response } from '../../../modules/response.mjs';

const publicRouter = express.Router();

publicRouter.get('/get-locations', (req, res) => {
    db.query(getLocations)
        .then(result => {
            res.json(response(false, defaultMessage(), result.rows));
            res.end();
        })
        .catch(err => {
            badRequest(req, res);
        })
})

publicRouter.get('/get-constant-by-type', (req, res) => {
    if (typeof req.query.type === 'undefined' || req.query.type == null || req.query.type == '') {
        badRequest(req, res);
    } else {
        db.query(getConstantByType, [req.query.type])
            .then(result => {
                res.json(response(false, defaultMessage(), result.rows[0]));
                res.end();
            })
            .catch(err => {
                badRequest(req, res);
            })
    }
});

publicRouter.get('/get-categories', (req, res) => {
    db.query(getCategory)
        .then(result => {
            res.json(response(false, defaultMessage, result.rows));
            res.end();
        })
        .catch(err => {
            badRequest(req, res);
        })
})


publicRouter.get('/get-congratulations', (req, res) => {
    if (typeof req.query.page === 'undefined' || req.query.page == null) {
        badRequest(req, res);
    } else {
        let query = getCongratulations;
        let limit = 20;
        if (typeof req.query.limit === 'undefined' || req.query.limit == null || req.query.limit == '') {
            limit = 20;
        } else {
            limit = req.query.limit;
        }
        let values = [limit, req.query.page];
        if(typeof req.query.holiday !== 'undefined' && req.query.holiday != null && req.query.holiday != ''){
            query = getCongratulationsWithCondition;
            values = [req.query.holiday,limit,req.query.page];
        }
        db.query(getHoliday)
        .then(result2 => {
            db.query(query,values)
            .then(result=>{
                res.json(response(false,defaultMessage(), {
                    holiday:result2.rows,
                    congratulations:result.rows
                }));
            })
            .catch(err=>{
                badRequest(req, res);
            })
        })
        .catch(err => {
            badRequest(req, res);
        })
    }

});


publicRouter.get('/get-home',verifyTokenWithNext,(req,res)=>{
    let userId=-1;
    if(typeof req.user === 'undefined' || req.user == null){
        userId=req.user.user.id;
    }
})


export { publicRouter };