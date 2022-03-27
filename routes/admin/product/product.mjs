import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { db } from '../../../modules/database/connection.mjs';
import { deleteImageById,addProduct, addProductImage, deleteFirstImages, deleteNotFirstImages, deleteProductImages, delete_product, getOldImages, update_product_query,getProductCount,getProduct, changeProductStatusById, getUserById } from '../../../modules/constant/admin_query.mjs';
import { badRequest, response } from '../../../modules/response.mjs';
import format from 'pg-format';
import { error } from 'console';
import { sendNotificationToUser } from '../push/push.mjs';
import { my_product } from '../../../modules/push/push_types.mjs';

const folder_large = 'public/uploads/product/large';
const folder_small = 'public/uploads/product/small';
const first_image_large = 'first_image_large';
const first_image_small = 'first_image_small';
const sliders_large = 'sliders_large';
const sliders_small = 'sliders_small';
const checkFolder_large = (req, res, next) => {
    if (!fs.existsSync(folder_large)) {
        fs.mkdirSync(folder_large, { recursive: true });
    }
    next();
}
const checkFolder_small = (req, res, next) => {
    if (!fs.existsSync(folder_small)) {
        fs.mkdirSync(folder_small, { recursive: true });
    }
    next();
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === first_image_large || file.fieldname === sliders_large)
            cb(null, folder_large);
        else if (file.fieldname === first_image_small || file.fieldname === sliders_small)
            cb(null, folder_small);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + ".png")
    }
})



const uploader = multer({ storage: storage })
const router = express.Router();


const addProductFunction = (req, res) => {
    const { name, price, size, status, sub_category, phone_number, description, user, isPopular } = req.body;
    let largeFirstImage = '';
    let smallFirstImage = '';
    let sliderLargeImages = [];
    let sliderSmallImages = [];
    if (typeof req.files !== 'undefined' && req.files.length) {
        req.files.forEach((file) => {
            if (file.fieldname === first_image_large) {
                largeFirstImage = file.destination + "/" + file.filename;
            }
            if (file.fieldname === first_image_small) {
                smallFirstImage = file.destination + "/" + file.filename;
            }
            if (file.fieldname === sliders_large) {
                sliderLargeImages.push(file.destination + "/" + file.filename);
            }
            if (file.fieldname === sliders_small) {
                sliderSmallImages.push(file.destination + "/" + file.filename);
            }
        })
    }

    db.query(addProduct, [name, price, status, description, sub_category, user, isPopular, size, phone_number])
        .then(result => {
            if (typeof result.rows !== 'undefined') {
                if (result.rows.length) {
                    let insertedId = result.rows[0].id;
                    let values = [
                        [smallFirstImage, largeFirstImage, insertedId, true, 'now()', 'now()']
                    ];
                    if (sliderLargeImages.length > 0) {
                        sliderLargeImages.forEach((image, i) => {
                            values.push([sliderSmallImages[i], image, insertedId, false, 'now()', 'now()'])
                        })
                    }
                    db.query(format(addProductImage, values))
                        .then(imageResult => {
                            if (typeof imageResult !== 'undefined') {
                                if (imageResult.rows.length) {
                                    res.json(response(false, "success", { product: result.rows, images: imageResult.rows }));
                                    res.end();
                                } else {
                                    res.json(response(false, "image is not available", { product: result.rows }));
                                    res.end();
                                }
                            } else {
                                res.json(response(false, "image is not available", { product: result.rows }));
                                res.end();
                            }
                        })
                        .catch(error => {
                            res.json(response(false, error, { product: result.rows }));
                            res.end();
                        })
                } else {
                    badRequest(req, res);
                }
            } else {
                badRequest(req, res);
            }
        })
        .catch(error => {
            badRequest(req, res);
        })
}

router.post('/add-product',
    verifyToken, checkFolder_large, checkFolder_small,
    uploader.any(),
    addProductFunction);

router.post('/get-product', verifyToken, (req, res) => {
    if (typeof req.body !== 'undefined') {
        if (typeof req.body.limit !== 'undefined' || typeof req.body.page !== 'undefined') {
            let condition="";
            let pagination=" ORDER BY  p.updated_at DESC LIMIT "+req.body.limit+" OFFSET ("+req.body.page+" - 1) * "+req.body.limit+"";
            if (typeof req.body.sub_category !== 'undefined' && req.body.sub_category!='') {
                condition+=" WHERE p.sub_category_id="+req.body.sub_category;
            }
            if (typeof req.body.status !== 'undefined' && req.body.status!='') {
                if(condition==''){
                    condition+=" WHERE "
                    condition+="p.status="+req.body.status;
                } else {
                    condition+=" and p.status="+req.body.status;
                }
            }
            if (typeof req.body.start_date !== 'undefined' && req.body.start_date!='') {
                let end_date = 'now()';
                if(typeof req.body.end_date !== 'undefined' && req.body.end_date!='') {
                    end_date = req.body.end_date;
                }
                if(condition==''){
                    condition+=" WHERE "
                    condition+="TO_CHAR(p.created_at :: DATE,'dd/mm/yyyy') BETWEEN TO_CHAR('"+req.body.start_date+"' :: DATE,'dd/mm/yyyy') AND TO_CHAR('"+end_date+"' :: DATE,'dd/mm/yyyy') ";
                } else {
                    condition+=" and TO_CHAR(p.created_at :: DATE,'dd/mm/yyyy') BETWEEN TO_CHAR('"+req.body.start_date+"' :: DATE,'dd/mm/yyyy') AND TO_CHAR('"+end_date+"' :: DATE,'dd/mm/yyyy') ";
                }
            }

            if(req.body.page==1){
                db.query(`${getProductCount} ${condition};`)
                .then(result_count=>{
                    db.query(`${getProduct} ${condition} ${pagination};`)
                    .then(result => {
                        let page_count = Math.round(result_count.rows[0].page_count/req.body.limit);
                        if(page_count <= 0){
                            page_count = 1;
                        }
                        res.json(response(false, "success", { product: result.rows,page_count:page_count}));
                        res.end();
                    })
                    .catch(err => {
                        badRequest(req, res);
                    })
                })
                .catch(err=>{
                    badRequest(req, res);
                })
            } else {
                db.query(`${getProduct} ${condition} ${pagination};`)
                    .then(result => {
                        res.json(response(false, "success", { product: result.rows}));
                        res.end();
                    })
                    .catch(err => {
                        badRequest(req, res);
                    })
            }

           
        } else {
            badRequest(req, res);
        }
    } else {
        badRequest(req, res);
    }
})

const deleteOldImages = (req, res, next) => {
    if (typeof req.params.id !== 'undefined') {
        db.query(getOldImages, [req.params.id])
            .then(result => {
                if (result.rows.length) {
                    result.rows.forEach((row, i) => {
                        fs.unlink(row.small_image, (err, data) => { })
                        fs.unlink(row.large_image, (err, data) => { })
                    })
                    next();
                } else {
                    next();
                }
            })
            .catch(err => {
                next();
            })
    } else {
        badRequest(req, res);
    }
}
router.delete('/delete-product/:id', verifyToken, deleteOldImages, (req, res) => {
    db.query(delete_product, [req.params.id])
        .then(result => {
            db.query(deleteProductImages, [req.params.id])
                .then(result2 => { })
                .catch(err => { })
            res.json(response(false, "success", null));
            res.end();
        })
        .catch(error => {
            badRequest(req, res);
        })
})




const updateProduct = (req, res) => {
    const { id, name, price, size, status, sub_category, phone_number, description, user, isPopular,cancel_reason } = req.body;
    let largeFirstImage = '';
    let smallFirstImage = '';
    let sliderLargeImages = [];
    let sliderSmallImages = [];

    let oldlargeFirstImage = '';
    let oldsmallFirstImage = '';
    let oldsliderImages = [];

    if (typeof req.files !== 'undefined' && req.files.length) {
        req.files.forEach((file) => {
            if (file.fieldname === first_image_large) {
                largeFirstImage = file.destination + "/" + file.filename;
            }
            if (file.fieldname === first_image_small) {
                smallFirstImage = file.destination + "/" + file.filename;
            }
            if (file.fieldname === sliders_large) {
                sliderLargeImages.push(file.destination + "/" + file.filename);
            }
            if (file.fieldname === sliders_small) {
                sliderSmallImages.push(file.destination + "/" + file.filename);
            }
        })
    }


    if (typeof req.oldImages !== 'undefined' && req.oldImages.length) {
        req.oldImages.forEach((row, i) => {
            if (row.is_first) {
                oldlargeFirstImage = row.large_image;
                oldsmallFirstImage = row.small_image;
            } else {
                oldsliderImages.push(row.large_image);
                oldsliderImages.push(row.small_image);
            }
        })
    }

    if (largeFirstImage !== '') {
        fs.unlink(oldlargeFirstImage, (err, data) => { });
        fs.unlink(oldsmallFirstImage, (err, data) => { });
        db.query(deleteFirstImages, [id])
            .then(result => { })
            .catch(err => { });
    }


    if (sliderLargeImages.length > 0) {
        oldsliderImages.forEach((image, i) => {
            fs.unlink(image, (err, data) => { });
        });
        db.query(deleteNotFirstImages, [id])
            .then(result => { })
            .catch(err => { });
    }

    

    db.query(update_product_query, [name, price, status, description, sub_category, user, isPopular, size, phone_number,id,cancel_reason])
        .then(result => {
            if (typeof result.rows !== 'undefined') {
                if (result.rows.length) {
                    let insertedId = result.rows[0].id;
                    let values = [];
                    if(largeFirstImage!=='')
                        values.push([smallFirstImage, largeFirstImage, insertedId, true, 'now()', 'now()']);
                    if (sliderLargeImages.length > 0) {
                        sliderLargeImages.forEach((image, i) => {
                            values.push([sliderSmallImages[i], image, insertedId, false, 'now()', 'now()']);
                        })
                    }

                    // add product images section
                    if(values.length > 0){
                        db.query(format(addProductImage, values))
                            .then(imageResult => {
                                if (typeof imageResult !== 'undefined') {
                                    if (imageResult.rows.length) {
                                        res.json(response(false, "success", { product: result.rows, images: imageResult.rows }));
                                        res.end();
                                    } else {
                                        res.json(response(false, "image is not available", { product: result.rows }));
                                        res.end();
                                    }
                                } else {
                                    res.json(response(false, "image is not available", { product: result.rows }));
                                    res.end();
                                }
                            })
                            .catch(error => {
                                res.json(response(false, error, { product: result.rows }));
                                res.end();
                            })
                    } else {
                        res.json(response(false, "image is not available", { product: result.rows }));
                        res.end();
                    }

                    changeProductStatus(req, res);

                
                } else {
                    res.status(400).json(response(false, "something went wrong1!", null));
                    res.end();
                }
            } else {
                res.status(400).json(response(false, "something went wrong2!", null));
                res.end();
            }
        })
        .catch(error => {
            res.status(400).json(response(false, "something went wrong3!", null));
            res.end();
        })
}

const getOldImagesFun = (req, res, next) => {
    if (typeof req.files !== 'undefined' && req.files.length) {
        let id = req.body.id;
        db.query(getOldImages,[id])
            .then(result => {
                req.oldImages = result.rows;
                next();
            })
            .catch(err => {
                next();
            })
    } else {
        next();
    }
}

router.put('/update-product',
    verifyToken,
    uploader.any(),
    getOldImagesFun,
    updateProduct);


router.delete('/delete-product-image/:id', verifyToken,(req, res) => {
    let id=req.params.id;
    let large=req.query.large;
    let small=req.query.small;
    fs.unlink(large, (err, data) => { });
    fs.unlink(small, (err, data) => { });
    db.query(deleteImageById,[id])
    .then(result => {
        res.json(response(false, "success", null));
        res.end();
    })
    .catch(err => {
        badRequest(req, res);
    })

})


const changeProductStatus= (req, res) => {
    const{status,cancel_reason,id} = req.body;
    if(typeof status === 'undefined' || cancel_reason === 'undefined' || typeof id === 'undefined')
    {
        badRequest(req, res);
    }
    else {
        db.query(changeProductStatusById,[status,cancel_reason,id])
        .then(result=>{
            if(result.rows.length){
                let userid = result.rows[0].user_id;
                let product_name= result.rows[0].product_name;
                let product_id= result.rows[0].id;
                db.query(getUserById,[userid])
                .then(result2=>{
                    if(result2.rows.length){
                        let notification_token = result2.rows[0].notification_token;
                        let body = result.rows[0].description;
                        let title = "Sizin "+product_name+" atly harydynyza uytgeshme girizildi";
                        if(status==4){
                            title = "Sizin "+product_name+" atly harydynyz tassyklanmady!";
                            body = `Harydynyz tassyklanmady: `+result.rows[0].cancel_reason;
                        }
                        let data = {
                            productId:product_id,
                            type:my_product
                        }
                        sendNotificationToUser(notification_token,title,body,data);
                    }
                })
                .catch(err=>{
                    console.error(err);
                })
            } else {
                console.error("error change product status");
            }
        })
        .catch(err=>{
            console.error(err);
        })
    }
}


export const productRouter = router;