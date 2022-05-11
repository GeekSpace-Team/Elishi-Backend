import express from 'express';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { secret_key } from '../../../modules/constant.mjs';
import { getAllUsers, addUserQuery, getUserQueryWithoutCondition, getUserQueryWithCondition, getUserImage, deleteUser, updateUserQuery, getUserCountWithoutCondition, getUserCountWithCondition, updateUserToken, updateUserQueryWithoutImage, changeUserProductStatuses, getUserById } from '../../../modules/constant/admin_query.mjs';
import { checkStatus } from '../../../modules/constant/status.mjs';
import { db } from '../../../modules/database/connection.mjs';
import { my_products } from '../../../modules/push/push_types.mjs';
import { badRequest, response } from '../../../modules/response.mjs';
import { sendNotificationToUser } from '../push/push.mjs';


const folder = 'public/uploads/user';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, folder)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + ".png")
    }
})

const upload = multer({ storage: storage });
const router = express.Router();

const checkFolder = (req, res, next) => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
    next();
}

const addUser = (req, res) => {
    if (typeof req.body === 'undefined') {
        badRequest(req, res);
        return;
    }
    const { fullname,
        address,
        phone_number,
        user_type_id,
        region_id,
        email,
        notification_token,
        gender,
        status } = req.body;
    let profileImage = '';
    if (typeof req.file !== 'undefined') {
        profileImage = req.file.destination + "/" + req.file.filename;
    }

    db.query(addUserQuery, [fullname,
        address,
        phone_number,
        profileImage,
        user_type_id,
        region_id,
        email,
        notification_token,
        gender,
        status])
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
                                    res.json(response(false, "success", result2.rows));
                                    res.end();
                                })
                                .catch(err => {
                                    badRequest(req, res);
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
router.post('/add-user',
    verifyToken,
    checkFolder,
    upload.single('image'),
    addUser);

router.get('/get-user', verifyToken, (req, res) => {
    if (typeof req.query.limit === 'undefined' || req.query.page === 'undefined') {
        badRequest(req, res);
        return;
    }
    let countQuery = getUserCountWithoutCondition;
    let query = getUserQueryWithoutCondition;
    let type = '';
    let page = req.query.page;
    let limit = req.query.limit;
    let values = [limit, page];
    let count_values = [];
    if (typeof req.query.query !== 'undefined' && typeof req.query.query != '') {
        query = getUserQueryWithCondition;
        countQuery = getUserCountWithCondition;
        type = req.query.query;
        values = [type, limit, page];
        count_values = [type];
    }
    if (req.query.page == 1) {
        db.query(countQuery, count_values)
            .then(results => {
                let page_count = Math.round(results.rows[0].page_count / req.query.limit);
                if (page_count <= 0) {
                    page_count = 1;
                }
                db.query(query, values)
                    .then(result => {
                        res.send(response(false, "success", {
                            users: result.rows,
                            page_count: page_count
                        }));
                        res.end();
                    })
                    .catch(err => {
                        badRequest(req, res);
                    })
            })
            .catch(err => {
                badRequest(req, res);
            })
    } else {
        db.query(query, values)
            .then(result => {
                res.send(response(false, "success", {
                    users: result.rows
                }));
                res.end();
            })
            .catch(err => {
                badRequest(req, res);
            })
    }
})

const deleteOldImage = (req, res, next) => {
    if (req.params.id) {
        db.query(getUserImage, [req.params.id])
            .then(result => {
                if (result.rows.length) {
                    fs.unlink(result.rows[0].profile_image, (err, data) => { })
                }
                next();
            })
            .catch(err => {
                next();
            })
    } else {
        badRequest(req, res);
    }
}

const deleteOldImageUpdate = (req, res, next) => {
    if (typeof req.file === 'undefined') {
        next();
        return;
    }
    if (req.body.id) {
        db.query(getUserImage, [req.body.id])
            .then(result => {
                if (result.rows.length) {
                    fs.unlink(result.rows[0].profile_image, (err, data) => { })
                }
                next();
            })
            .catch(err => {
                badRequest(req, res);
            })
    } else {
        badRequest(req, res);
    }
}

router.delete('/delete-user/:id', verifyToken, deleteOldImage, (req, res) => {
    db.query(deleteUser, [req.params.id])
        .then(result => {
            res.json(response(false, "success", null));
            res.end();
        })
        .catch(err => {
            badRequest(req, res);
        })
})


const updateUser = (req, res) => {
    if (typeof req.body === 'undefined') {
        badRequest(req, res);
        return;
    }
    const { id, fullname,
        address,
        phone_number,
        user_type_id,
        region_id,
        email,
        notification_token,
        gender,
        status } = req.body;
    let profileImage = '';
    let query = updateUserQueryWithoutImage;
    let values = [fullname,
        address,
        phone_number,
        user_type_id,
        region_id,
        email,
        notification_token,
        gender,
        status, id];
    if (typeof req.file !== 'undefined') {
        profileImage = req.file.destination + "/" + req.file.filename;
        query=updateUserQuery;
        values = [fullname,
            address,
            phone_number,
            profileImage,
            user_type_id,
            region_id,
            email,
            notification_token,
            gender,
            status, id];
    }

    console.log(region_id)

    db.query(query, values)
        .then(result => {
            if (typeof result !== 'undefined') {
                if (result.rows.length) {
                    res.json(response(false, "success", result.rows));
                    res.end();
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

router.put('/update-user', verifyToken, upload.single('image'), deleteOldImageUpdate, updateUser);

router.get('/get-all-users', verifyToken, (req, res) => {
    db.query(getAllUsers)
        .then(result => {
            res.json(response(false, "success", result.rows));
            res.end();
        })
        .catch(err => {
            badRequest(req, res);
        })
})

router.post('/change-product-status', verifyToken, (req, res) => {
    const{id,status} = req.body;
    if(typeof status === 'undefined' || typeof id === 'undefined'){
        badRequest(req, res);
    } else {
        db.query(changeUserProductStatuses,[status, id])
        .then(result=>{
            if(result.rows.length){
                let userid = id;
                db.query(getUserById,[userid])
                .then(result2=>{
                    if(result2.rows.length){
                        let notification_token = result2.rows[0].notification_token;
                        let statuslbl = checkStatus(status).label;
                        let title = "Статус всех ваших товаров был "+statuslbl+"! / Siziň ähli harytlaryňyzyň statusy "+statuslbl+" edildi!";
                        let body = "Статус всех ваших товаров был "+statuslbl+"! / Siziň ähli harytlaryňyzyň statusy "+statuslbl+" edildi!";
                       
                        let data = {
                            userid:userid,
                            type:my_products
                        }
                        sendNotificationToUser(notification_token,title,body,data);
                    }
                })
                .catch(err=>{
                    console.error(err);
                })
                res.json(response(false, "success", result.rows));
                res.end();
                
            } else {
                badRequest(req, res);
            }
        })
        .catch(err=>{
            badRequest(req, res);
        })
    }
})
export const userRouter = router;