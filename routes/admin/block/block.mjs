import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { getBlackList, getBlackList2 } from '../../../modules/constant/admin_query.mjs';
import { db } from '../../../modules/database/connection.mjs';
import { defaultMessage, message } from '../../../modules/message.mjs';
import { badRequest,response } from '../../../modules/response.mjs';

const router = express.Router();

router.get('/get-blocked-list',verifyToken,(req, res)=>{
    db.query(getBlackList2)
    .then(result=>{
            console.log("Success");
            res.json(response(false,defaultMessage,result.rows));
        
    })
    .catch(error=>{
        badRequest(req, res);
    })
});

export const blockRouter = router;