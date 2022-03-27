import express from 'express';
import { socket_io } from '../../../index.mjs';
import { addUserQuery, updateUserToken } from '../../../modules/constant/admin_query.mjs';
import { addFavorite, checkExistUser, checkFavorite, checkVerification, checkVerification2, deleteFavorite, getFavorite, getUserById, getUserByPhoneNumber, insertPhoneVerification } from '../../../modules/constant/user_queries.mjs';
import { db } from '../../../modules/database/connection.mjs';
import { defaultMessage, message, successfullyDeleted } from '../../../modules/message.mjs';
import { badRequest, errorResponse, response } from '../../../modules/response.mjs';
import jwt from 'jsonwebtoken';
import { secret_key } from '../../../modules/constant.mjs';
import { verifyUserToken } from '../../../modules/auth/token.mjs';


const router = express.Router();
function startsWith(str, word) {
    return str.lastIndexOf(word, 0) === 0;
}
router.post('/phone-verification', (req, res) => {

    if (typeof req.body === 'undefined' || req.body == null
        || typeof req.body.phoneNumber === 'undefined' || req.body.phoneNumber == null || req.body.phoneNumber == '' || !startsWith(req.body.phoneNumber, "+9936")) {
        badRequest(req, res);
        return;
    }
    db.query(checkExistUser, [req.body.phoneNumber])
        .then(result => {
            if (result.rows.length) {
                let tm = `Tassyklaýjy kody ${req.body.phoneNumber} telefon belgisine ugradyldy`;
                let ru = `Код подтверждения отправлен на номер ${req.body.phoneNumber}`;
                let en = `Your verification code sent to ${req.body.phoneNumber}`;
                let seq = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
                let text = `Siziň Elishi tassyklaýjy kodyňyz: ${seq}`;
                let final = response(false, message(tm, ru, en), {
                    user: null,
                    exist: "not-exist"
                });
                if (result.rows[0].count_exist > 0) {
                    final = response(false, message(tm, ru, en), {
                        user: null,
                        exist: "exist"
                    });


                }

                db.query(insertPhoneVerification, [req.body.phoneNumber, seq])
                    .then(result_insert => {
                        if (result_insert.rows.length) {
                            const data = {
                                number: req.body.phoneNumber,
                                text: text
                            }
                            socket_io.emit('onMessage', data);
                            res.json(final);
                            res.end();
                        } else {
                            badRequest(req, res);
                        }
                    })
                    .catch(err => {
                        badRequest(req, res);
                    })
            } else {
                badRequest(req, res);
            }
        })
        .catch(err => {
            badRequest(req, res);
        })
})


router.post('/code-verification', (req, res) => {
    if (typeof req.body === 'undefined' || req.body == null
        || typeof req.body.phoneNumber === 'undefined' || req.body.phoneNumber == null || req.body.phoneNumber == '' || !startsWith(req.body.phoneNumber, "+9936")
        || typeof req.body.code === 'undefined' || req.body.code == null || req.body.code == '' || req.body.code.length < 4) {
        badRequest(req, res);
        return;
    }
    let phoneNumber = req.body.phoneNumber;
    let code = req.body.code;
    db.query(checkVerification, [phoneNumber, code, 3])
        .then(result => {
            if (result.rows.length) {
                db.query(getUserByPhoneNumber, [req.body.phoneNumber])
                    .then(result => {
                        if (result.rows.length) {
                            let tm = `Üstünlikli içeri girdiňiz!`;
                            let ru = `Вы успешно вошли в систему`;
                            let en = `You are successfully signed in`;
                            res.json(response(true, message(tm, ru, en), {
                                user: result.rows[0],
                                exist: "exist"
                            }))
                            res.end();
                        } else {
                            let tm = `${req.body.phoneNumber} telefon belgisine degişli ulanyjy hasaby tapylmady!`;
                            let ru = `Учетная запись пользователя ${req.body.phoneNumber} не найдена!`;
                            let en = `User account not found ${req.body.phoneNumber}!`;
                            res.json(response(true, message(tm, ru, en), {
                                user: null,
                                exist: "not-exist"
                            }))
                            res.end();
                        }
                    })
                    .catch(err => {
                        badRequest(req, res);
                    })
            } else {
                res.status(400).json(response(true, message("Tassyklaýjy kod nädogry", "Ошибка кода подтверждения", "Verification code error"), null));
                res.end();
            }
        })
        .catch(err => {
            badRequest(req, res);
        })
})

router.post('/sign-up', (req, res) => {
    if (typeof req.body === 'undefined' || req.body == null
        || typeof req.body.fullname === 'undefined' || typeof req.body.fullname == null
        || typeof req.body.phone_number === 'undefined' || req.body.phone_number == null || req.body.phone_number == '' || !startsWith(req.body.phone_number, "+9936")) {
            badRequest(req, res);
        return;
    }

    db.query(checkVerification2, [req.body.phone_number, 100])
        .then(result_check => {
            if (result_check.rows.length) {
                const { fullname, district_id, notif_token, phone_number } = req.body;
                db.query(getUserByPhoneNumber, [req.body.phone_number])
                .then(result => {
                    if (result.rows.length) {
                        let tm = `Üstünlikli içeri girdiňiz!`;
                            let ru = `Вы успешно вошли в систему`;
                            let en = `You are successfully signed in`;
                            res.json(response(true, message(tm, ru, en), {
                                user: result.rows[0],
                                exist: "exist"
                            }))
                            res.end();
                    } else {
                        db.query(addUserQuery, [fullname,
                            "",
                            phone_number,
                            "",
                            2,
                            district_id,
                            "",
                            notif_token,
                            1,
                            1])
                            .then(result => {
                                if (typeof result !== 'undefined') {
                                    if (result.rows.length) {
                                        const user = {
                                            id: result.rows[0].id,
                                            user_type: "user"
                                        }
                                        jwt.sign({ user }, secret_key, (err, token) => {
                                            if (err) {
                                                badRequest(req, res);
                                            }
                                            else {
                                                db.query(updateUserToken, [token, result.rows[0].id])
                                                    .then(result2 => {
                                                        res.json(response(false, defaultMessage(), {
                                                            user:result2.rows[0],
                                                            exist: "exist"
                                                        }));
                                                        res.end();
                                                    })
                                                    .catch(err => {
                                                        res.send(err+"")
                                                    })
                                            }
                                        });
        
        
                                    } else {
                                        badRequest(req, res);
                                    }
                                } else {
                                    badRequest(req, res);
                                }
                            })
                            .catch(err => {
                                badRequest(req, res);
                            })
                    }
                
                })
            } else {
                badRequest(req, res);
            }
        })
        .catch(err => {
            badRequest(req, res);
        })
})


router.get('/get-user-by-id',verifyUserToken,(req,res)=>{
    if(typeof req.user === 'undefined' || req.user == null){
        badRequest(req, res);
    } else {
        let userId=req.user.user.id;
        db.query(getUserById,[userId])
        .then(result=>{
            res.json(response(false,defaultMessage,result.rows));
        })
        .catch(err=>{
            badRequest(req, res);
        })
    }
});

router.post('/add-favorite',verifyUserToken,(req,res)=>{
    if(typeof req.user === 'undefined' || req.user == null || typeof req.body === 'undefined' || typeof req.body == null || typeof req.body.p_id === 'undefined' || req.body.p_id == null){
        badRequest(req, res);
    } else {
        let userId=req.user.user.id;
        db.query(checkFavorite,[userId,req.body.p_id])
        .then(check_result=>{
            if(check_result.rows.length && typeof check_result.rows[0].fav_count !=='undefined' && check_result.rows[0].fav_count>0){
                res.json(response(false,defaultMessage,check_result.rows[0]));
            } else {
                db.query(addFavorite,[userId,req.body.p_id])
                .then(result=>{
                    if(result.rows.length){
                        res.json(response(false,defaultMessage,result.rows[0]));
                    } else {
                        badRequest(req, res);
                    }
                })
                .catch(err=>{
                    res.send(err+"");
                })
            }
        })
        .catch(err=>{
            res.send(err+"");
        })
        
    }
});


router.delete('/delete-favorite/:p_id',verifyUserToken,(req,res)=>{
    if(typeof req.user === 'undefined' || req.user == null || typeof req.params === 'undefined' || typeof req.params == null || typeof req.params.p_id === 'undefined' || req.params.p_id == null){
        badRequest(req, res);
    } else {
        let userId=req.user.user.id;
        db.query(deleteFavorite,[userId,req.params.p_id])
        .then(result=>{
            res.json(response(false,successfullyDeleted(),result.rows));
        })
        .catch(err => {
            badRequest(req, res);
        })
    }
});


router.get('/get-favorite',verifyUserToken,(req,res)=>{
    if(typeof req.user === 'undefined' || req.user == null || typeof req.query === 'undefined' || typeof req.query == null || typeof req.query.page === 'undefined' || req.query.page == null){
        badRequest(req, res);
    } else {
        let limit=20;
        if(typeof req.query.limit === 'undefined' || req.query.limit == null || req.query.limit == ''){
            limit=20;
        } else {
            limit=req.query.limit;
        }
        let userId=req.user.user.id;
        db.query(getFavorite,[userId,limit,req.query.page])
        .then(result=>{
            res.json(response(false,defaultMessage(),result.rows));
        })
        .catch(err => {
            badRequest(req, res);
        })
    }
});







export const userRouter = router;