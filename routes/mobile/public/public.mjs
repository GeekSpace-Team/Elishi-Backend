import express from 'express';
import { verifyTokenWithNext,verifyUserToken } from '../../../modules/auth/token.mjs';
import { bringToFront,getCategoryFilter,getRegionFilter,getCategory, getCongratulations, getCongratulationsWithCondition, getConstantByType, getHoliday, getHome, getLocations,getEventProducts, getProductById, getBanners, getMainCategory, getAds, vipUser, getEvents, getNewProducts, getTrendProducts, getCollections, getSimilarProducts, getProductsQuery, getSubCategoryCon, searchQuery } from '../../../modules/constant/user_queries.mjs';
import { db } from '../../../modules/database/connection.mjs';
import { defaultMessage, message } from '../../../modules/message.mjs';
import { badRequest, response } from '../../../modules/response.mjs';
import format from 'pg-format';
import multer from 'multer';
import {deleteProductImages,addProduct,addProductImage,deleteFirstImages,deleteNotFirstImages,update_product_query_user,getOldImages,delete_product} from '../../../modules/constant/admin_query.mjs';
import fs from 'fs';

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
    if(typeof req.user !== 'undefined' && req.user != null){
        userId=req.user.user.id;
    }
    let version='';
    let versionRequirement='';
    if(typeof req.query !== 'undefined' && typeof req.query.device !== 'undefined' && req.query.device!=null){
        version=req.query.device+'Version';
        versionRequirement=req.query.device+'VersionRequirement';
    }
    const getDeviceVersion = `SELECT value,type FROM vars WHERE type='${version}' OR type='${versionRequirement}';`;
    db.query(`${getBanners} ${getMainCategory} ${getAds} ${vipUser} ${getEvents} ${format(getNewProducts,userId)} ${format(getTrendProducts,userId)} ${getCollections} ${getDeviceVersion}`)
    .then(results=>{
        let collections=results[7].rows;
        let eventProducts=[];
        if(collections.length>0){
        collections.map((item,i)=>{
            let requiredProducts=Array.from(item.collections);
            db.query(format(getEventProducts,userId,requiredProducts))
            .then(result2=>{
                eventProducts.push({event:item,products:result2.rows})
                if(collections.length-1==i){
                    res.send(response(false, defaultMessage, {
                        banner:results[0].rows,
                        main_category:results[1].rows,
                        ads:results[2].rows,
                        vip_users:results[3].rows,
                        events:results[4].rows,
                        newProducts:results[5].rows,
                        trendProducts:results[6].rows,
                        deviceVersion:results[8].rows,
                        eventProducts:eventProducts,
                    }));
                }
            })
            .catch(err => {
                res.send(err+" 1");
            })
        })
    } else {
        res.send(response(false, defaultMessage, {
            banner:results[0].rows,
            main_category:results[1].rows,
            ads:results[2].rows,
            vip_users:results[3].rows,
            events:results[4].rows,
            newProducts:results[5].rows,
            trendProducts:results[6].rows,
            deviceVersion:results[8].rows,
            eventProducts:null
        }));
    }
        
    })
    .catch(err=>{
        res.send(err+" 0");
    })
});

publicRouter.get('/get-product-by-id',verifyTokenWithNext,(req,res)=>{
    let userId=-1;
    if(typeof req.query === 'undefined' || typeof req.query == null || typeof req.query.p_id === 'undefined' || req.query.p_id == null){
        badRequest(req, res);
        return;
    }
    if(typeof req.user === 'undefined' || req.user == null){
        userId=-1;
    } else {
        userId=req.user.user.id;
    }
    let product_id=req.query.p_id;
    db.query(getProductById,[userId,product_id])
    .then(result=>{
        let cat_id=result.rows[0].sub_category_id;
        db.query(getSimilarProducts,[userId,cat_id])
        .then(result2=>{
            res.json(response(false,defaultMessage(), {product:result.rows[0],similar:result2.rows}));
            res.end();
        })
        .catch(err => {
            badRequest(req, res);
        })
        
    })
    .catch(err=>{
        badRequest(req, res);
    })
})


publicRouter.post('/get-products',verifyTokenWithNext,async(req,res)=>{
    let userId=-1;
    if(typeof req.body === 'undefined' || typeof req.body == null || typeof req.body.page === 'undefined' || req.body.page == null){
        badRequest(req, res);
        return;
    }
    let limit = 20;
    let page = req.body.page;
    if(typeof req.body.limit !== 'undefined' && req.body.limit != null){
        limit = req.body.limit;
    }
    if(typeof req.user === 'undefined' || req.user == null){
        userId=-1;
    } else {
        userId=req.user.user.id;
    }
    let whereQuery=``;
    
    let sub_category_query=``;
    let requiredCategories=[];
    if(typeof req.body.sub_category !== 'undefined' && req.body.sub_category != null && req.body.sub_category.length > 0){
        requiredCategories=Array.from(req.body.sub_category);
    }

    if(typeof req.body.category !== 'undefined' && req.body.category != null){
        await db.query(getSubCategoryCon,[req.body.category])
        .then(result=>{
            if(result.rows.length){
                result.rows.forEach(row=>{
                    requiredCategories.push(row.id);
                })
                
            }
        }).catch(err=>{
            res.send(err+"");
        })
    }

    let priceQuery=``;
    if(typeof req.body.min !== 'undefined' && req.body.min != null && typeof req.body.max !== 'undefined' && req.body.max != null){
        priceQuery=` (p.price BETWEEN %s AND %s) `;
        priceQuery=format(priceQuery, req.body.min, req.body.max);
    }

    let regionQuery=``;
    if(typeof req.body.region !== 'undefined' && req.body.region != null && req.body.region.length > 0) {
        regionQuery=` d.id IN (%s) `;
        regionQuery=format(regionQuery, req.body.region);
    }

    let statusQuery=``;
    if(typeof req.body.status !== 'undefined' && req.body.status!=null && req.body.status.length > 0){
        statusQuery=` p.status IN (%s) `;
        statusQuery=format(statusQuery,req.body.status);
    }

    if(requiredCategories.length > 0) {
        sub_category_query=` p.sub_category_id IN (%s) `;
        sub_category_query=format(sub_category_query, requiredCategories);
    }

    if(sub_category_query!=''){
        if(whereQuery==''){
            whereQuery+=` WHERE ${sub_category_query}`;
        } else {
            whereQuery+=` AND ${sub_category_query}`;
        } 
    }

    if(priceQuery!=''){
        if(whereQuery==''){
            whereQuery+=` WHERE ${priceQuery}`;
        } else {
            whereQuery+=` AND ${priceQuery}`;
        } 
    }

    if(regionQuery!=''){
        if(whereQuery==''){
            whereQuery+=` WHERE ${regionQuery}`;
        } else {
            whereQuery+=` AND ${regionQuery}`;
        } 
    }

    if(statusQuery!=''){
        if(whereQuery==''){
            whereQuery+=` WHERE ${statusQuery}`;
        } else {
            whereQuery+=` AND ${statusQuery}`;
        } 
    }
    let orderQuery=``;
    if(typeof req.body.sort !== 'undefined' && req.body.sort != null){
        if(req.body.sort==0){
            // 0 = by status and updated_at
            orderQuery=`ORDER BY p.status DESC,p.updated_at DESC`;
        }
        if(req.body.sort==1){
            // 1 = by price DESC
            orderQuery=`ORDER BY p.price DESC,p.status DESC,p.updated_at DESC`;
        }
        if(req.body.sort==2){
            // 2 = by price ASC
            orderQuery=`ORDER BY p.price ASC,p.status DESC,p.updated_at DESC`;
        }
        if(req.body.sort==3){
            // 3 = FROM New products
            orderQuery=`ORDER BY p.status DESC,p.updated_at DESC`;
        }
        if(req.body.sort==4){
            // 4 = FROM Old products
            orderQuery=`ORDER BY p.status DESC,p.updated_at ASC`;
        }
    } else {
        orderQuery=`ORDER BY p.status DESC,p.updated_at DESC`;
    }
    
    let query = format(getProductsQuery,whereQuery,orderQuery);
    await db.query(query,[userId,limit,page])
    .then(result=>{
        res.json(response(false, defaultMessage(), result.rows));
    }).catch(err => {
        badRequest(req,res);
    })
})

publicRouter.get('/search',verifyTokenWithNext,async(req,res)=>{
    let userId=-1;
    if(typeof req.query === 'undefined' || typeof req.query == null || typeof req.query.page === 'undefined' || req.query.page == null || typeof req.query.query === 'undefined' || req.query.query==null){
        badRequest(req, res);
        return;
    }
    let limit = 20;
    let page = req.body.page;
    if(typeof req.body.limit !== 'undefined' && req.body.limit != null){
        limit = req.body.limit;
    }
    if(typeof req.user === 'undefined' || req.user == null){
        userId=-1;
    } else {
        userId=req.user.user.id;
    }
   await db.query(searchQuery,[userId,req.query.query,limit,page])
   .then(result=>{
       if(result.rows.length)
        res.json(response(false, defaultMessage(),result.rows));
   })
   .catch(err=>{
       res.send(err+"")
   })
})


publicRouter.get("/get-filter",(req,res)=>{
    db.query(`${getCategoryFilter} ${getRegionFilter}`)
    .then(result=>{
        res.json(response(false,defaultMessage(),{
            category:result[0].rows,
            regions:result[1].rows
        }))
    })
    .catch(err=>{
        badRequest(req,res);
    })
})


// add product

const addProductFunction = async(req, res) => {
    let userId=-1;
    if(typeof req.user === 'undefined' || req.user == null){
        userId=-1;
        badRequest(req,res);
        return;
    }
    userId=req.user.user.id;
    
    const { name, price, size, sub_category, phone_number, description } = req.body;
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

    await db.query(addProduct, [name, price, 0, description, sub_category, userId, false, size, phone_number])
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

publicRouter.post('/add-product',
    verifyUserToken, checkFolder_large, checkFolder_small,
    uploader.any(),
    addProductFunction);


// update product
const updateProduct = (req, res) => {
    let userId=-1;
    if(typeof req.user === 'undefined' || req.user == null){
        userId=-1;
        badRequest(req,res);
        return;
    }
    userId=req.user.user.id;
    const { id, name, price, size, sub_category, phone_number, description } = req.body;
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

    

    db.query(update_product_query_user, [name, price, description, sub_category, size, phone_number,id])
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
            res.status(400).json(response(false, "something went wrong2!", null));
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

publicRouter.put('/update-product',
    verifyUserToken,
    uploader.any(),
    getOldImagesFun,
    updateProduct);


// delete product
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


publicRouter.delete('/delete-product/:id', verifyUserToken, deleteOldImages, (req, res) => {
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

// bring to front
publicRouter.post('/bring-to-front',verifyUserToken,(req,res)=>{
    let userId=-1;
    if(typeof req.user === 'undefined' || req.user == null){
        userId=-1;
        badRequest(req,res);
        return;
    }
    userId=req.user.user.id;
    if(typeof req.body.p_id ==='undefined' || req.body.p_id == null){
        badRequest(req,res);
        return;
    }
    db.query(bringToFront,[req.body.p_id])
    .then(result=>{
        if(result.rows.length){
            res.json(response(false,defaultMessage(),result.rows));
        } else {
            badRequest(req,res);
        }
    })
    .catch(err=>{
        badRequest(req,res);
    })
})





export { publicRouter };