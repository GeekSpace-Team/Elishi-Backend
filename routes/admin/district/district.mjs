import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { addDistrictQuery, deleteDistrict, getDistrict, updateDistrict } from '../../../modules/constant/admin_query.mjs';
import {db} from '../../../modules/database/connection.mjs';
import { badRequest, response } from '../../../modules/response.mjs';

const router = express.Router();
router.post('/add-district',verifyToken,(req, res) => {
    const{district_name_tm,district_name_ru,district_name_en,region_id} = req.body;
    db.query(addDistrictQuery,[district_name_tm,district_name_ru,district_name_en,region_id])
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
    })
});

router.get('/get-district',verifyToken,(req,res)=>{
    db.query(getDistrict)
    .then(result=>{
        res.json(response(false,"success",result.rows));
        res.end();
    })
    .catch(err=>{
        badRequest(req,res);
    })
})

router.delete('/delete-district/:id',verifyToken,(req,res)=>{
    if(typeof req.params.id !== 'undefined'){
        db.query(deleteDistrict,[req.params.id])
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

router.put('/update-district',verifyToken,(req, res) => {
    const{id,district_name_tm,district_name_ru,district_name_en,region_id} = req.body;
    db.query(updateDistrict,[district_name_tm,district_name_ru,district_name_en,region_id,id])
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
    })
});


export const districtRouter = router;