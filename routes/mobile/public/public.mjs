import CyrillicToTranslit from "cyrillic-to-translit-js";
import express from "express";
import format from "pg-format";
import fs from "fs";
import multer from "multer";
import sharp from "sharp";
import { socket_io } from "../../../index.mjs";
import { verifyTokenWithNext, verifyUserToken } from "../../../modules/auth/token.mjs";
import { addProduct, addProductImage, deleteFirstImages, deleteImageById, deleteNotFirstImages, deleteProductImages, delete_product, getOldImages, update_product_query_user, update_product_query_user_with_status } from "../../../modules/constant/admin_query.mjs";
import { productStatuses } from "../../../modules/constant/status.mjs";
import { bringToFront, getAds, getAdsProducts, getAdsSingleProduct, getBanners, getCategory, getCategoryFilter, getCollections, getCongratulations, getCongratulationsWithCondition, getConstantById, getConstantByType, getEventProducts, getEvents, getHoliday, getHome, getLocations, getMainCategory, getNewProducts, getProductById, getProductUserId, getProductsQuery, getRegionFilter, getSimilarProducts, getSubCategoryCon, getTrendProducts, getUserById, insertPhoneVerification, searchQuery, vipUser } from "../../../modules/constant/user_queries.mjs";
import { db } from "../../../modules/database/connection.mjs";
import { defaultMessage, errorMessage, message } from "../../../modules/message.mjs";
import { badRequest, reachLimit, response } from "../../../modules/response.mjs";

const cyrillicToTranslit = new CyrillicToTranslit();

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

publicRouter.get('/get-constant-by-id', (req, res) => {
    if (typeof req.query.type === 'undefined' || req.query.type == null || req.query.type == '') {
        badRequest(req, res);
    } else {
        db.query(getConstantById, [req.query.type])
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
        if (typeof req.query.holiday !== 'undefined' && req.query.holiday != null && req.query.holiday != '') {
            query = getCongratulationsWithCondition;
            values = [req.query.holiday, limit, req.query.page];
        }
        db.query(getHoliday)
            .then(result2 => {
                db.query(query, values)
                    .then(result => {
                        res.json(response(false, defaultMessage(), {
                            holiday: result2.rows,
                            congratulations: result.rows
                        }));
                    })
                    .catch(err => {
                        badRequest(req, res);
                    })
            })
            .catch(err => {
                badRequest(req, res);
            })
    }

});


publicRouter.get('/get-home', verifyTokenWithNext, (req, res) => {
    let userId = -1;
    if (typeof req.user !== 'undefined' && req.user != null) {
        userId = req.user.user.id;
    }
    let version = '';
    let versionRequirement = '';
    if (typeof req.query !== 'undefined' && typeof req.query.device !== 'undefined' && req.query.device != null) {
        version = req.query.device + 'Version';
        versionRequirement = req.query.device + 'VersionRequirement';
    }
    const getDeviceVersion = `SELECT value,type FROM vars WHERE type='${version}' OR type='${versionRequirement}';`;
    db.query(`${getBanners} ${getMainCategory} ${getAds} ${vipUser} ${getEvents} ${format(getNewProducts, userId)} ${format(getTrendProducts, userId)} ${getCollections} ${getDeviceVersion}`)
        .then(results => {
            let collections = results[7].rows;
            let eventProducts = [];
            if (collections.length > 0) {
                collections.map((item, i) => {
                    let requiredProducts = Array.from(item.collections);
                    db.query(format(getEventProducts, userId, requiredProducts))
                        .then(result2 => {
                            eventProducts.push({ event: item, products: result2.rows })
                            if (collections.length - 1 == i) {
                                res.send(response(false, defaultMessage, {
                                    banner: results[0].rows,
                                    main_category: results[1].rows,
                                    ads: results[2].rows,
                                    vip_users: results[3].rows,
                                    events: results[4].rows,
                                    newProducts: results[5].rows,
                                    trendProducts: results[6].rows,
                                    deviceVersion: results[8].rows,
                                    eventProducts: eventProducts,
                                }));
                            }
                        })
                        .catch(err => {
                            res.send(err + " 1");
                        })
                })
            } else {
                res.send(response(false, defaultMessage, {
                    banner: results[0].rows,
                    main_category: results[1].rows,
                    ads: results[2].rows,
                    vip_users: results[3].rows,
                    events: results[4].rows,
                    newProducts: results[5].rows,
                    trendProducts: results[6].rows,
                    deviceVersion: results[8].rows,
                    eventProducts: null
                }));
            }

        })
        .catch(err => {
            res.send(err + " 0");
        })
});

publicRouter.get('/get-product-by-id', verifyTokenWithNext, async (req, res) => {
    let userId = -1;
    if (typeof req.query === 'undefined' || typeof req.query == null || typeof req.query.p_id === 'undefined' || req.query.p_id == null) {
        badRequest(req, res);
        return;
    }
    if (typeof req.user === 'undefined' || req.user == null) {
        userId = -1;
    } else {
        userId = req.user.user.id;
    }
    let ads = null;
    await db.query(getAdsSingleProduct)
        .then(result3 => {
            if (result3.rows.length) {
                ads = result3.rows[0];
            }
        })
        .catch(err => {
            console.log(err + "");
        })
    let product_id = req.query.p_id;
    await db.query(getProductById, [userId, product_id])
        .then(result => {
            let cat_id = result.rows[0].sub_category_id;
            db.query(getSimilarProducts, [userId, cat_id])
                .then(result2 => {
                    res.json(response(false, defaultMessage(), { product: result.rows[0], similar: result2.rows, ads: ads }));
                    res.end();
                })
                .catch(err => {
                    res.json(response(false, defaultMessage(), { product: result.rows[0], similar: [], ads: ads }));
                    res.end();
                })

        })
        .catch(err => {
            badRequest(req, res);
        })
})

publicRouter.get('/get-products-ads', async (req, res) => {
    db.query(getAdsProducts)
        .then(result => {
            res.json(response(false, defaultMessage(), result.rows));
        })
        .catch(err => {
            badRequest(req, res);
        })
})


publicRouter.post('/get-products', verifyTokenWithNext, async (req, res) => {
    let userId = -1;
    if (typeof req.body === 'undefined' || typeof req.body == null || typeof req.body.page === 'undefined' || req.body.page == null) {
        badRequest(req, res);
        return;
    }
    let limit = 20;
    let page = req.body.page;
    if (typeof req.body.limit !== 'undefined' && req.body.limit != null) {
        limit = req.body.limit;
    }
    if (typeof req.user === 'undefined' || req.user == null) {
        userId = -1;
    } else {
        userId = req.user.user.id;
    }
    let whereQuery = ` WHERE p.status!=0 `;

    let sub_category_query = ``;
    let requiredCategories = [];
    if (typeof req.body.sub_category !== 'undefined' && req.body.sub_category != null && req.body.sub_category.length > 0) {
        requiredCategories = Array.from(req.body.sub_category);
    }

    if (typeof req.body.category !== 'undefined' && req.body.category != null) {
        await db.query(getSubCategoryCon, [req.body.category])
            .then(result => {
                if (result.rows.length) {
                    result.rows.forEach(row => {
                        requiredCategories.push(row.id);
                    })

                } else {

                    return;
                }
            }).catch(err => {
                badRequest(req, res);
                return;
            })
    }

    if (typeof req.body.category !== 'undefined' && req.body.category != null && requiredCategories.length <= 0) {
        res.json(response(false, defaultMessage(), []));
        return;
    }

    let priceQuery = ``;
    if (typeof req.body.min !== 'undefined' && req.body.min != null && typeof req.body.max !== 'undefined' && req.body.max != null) {
        priceQuery = ` (p.price BETWEEN %s AND %s) `;
        priceQuery = format(priceQuery, req.body.min, req.body.max);
    }

    let regionQuery = ``;
    if (typeof req.body.region !== 'undefined' && req.body.region != null && req.body.region.length > 0) {
        regionQuery = ` d.id IN (%s) `;
        regionQuery = format(regionQuery, req.body.region);
    }

    let statusQuery = ``;
    if (typeof req.body.status !== 'undefined' && req.body.status != null && req.body.status.length > 0) {
        statusQuery = ` p.status IN (%s) `;
        statusQuery = format(statusQuery, req.body.status);
    }

    let userQuery = ``;
    
    if (typeof req.body.user !== 'undefined' && req.body.user != null && req.body.user != 0) {
        userQuery = ` p.user_id = %s `;
        userQuery = format(userQuery, req.body.user);
    }
    if (requiredCategories.length > 0) {
        sub_category_query = ` p.sub_category_id IN (%s) `;
        sub_category_query = format(sub_category_query, requiredCategories);
    }

    if (sub_category_query != '') {
        if (whereQuery == '') {
            whereQuery += ` WHERE ${sub_category_query}`;
        } else {
            whereQuery += ` AND ${sub_category_query}`;
        }
    }

    if (priceQuery != '') {
        if (whereQuery == '') {
            whereQuery += ` WHERE ${priceQuery}`;
        } else {
            whereQuery += ` AND ${priceQuery}`;
        }
    }

    if (regionQuery != '') {
        if (whereQuery == '') {
            whereQuery += ` WHERE ${regionQuery}`;
        } else {
            whereQuery += ` AND ${regionQuery}`;
        }
    }

    if (statusQuery != '') {
        if (whereQuery == '') {
            whereQuery += ` WHERE ${statusQuery}`;
        } else {
            whereQuery += ` AND ${statusQuery}`;
        }
    }

    if (userQuery != '') {
        if (whereQuery == '') {
            whereQuery += ` WHERE ${userQuery}`;
        } else {
            whereQuery += ` AND ${userQuery}`;
        }
    }

    let orderQuery = ``;
    if (typeof req.body.sort !== 'undefined' && req.body.sort != null) {
        if (req.body.sort == 0) {
            // 0 = by status and updated_at
            orderQuery = `ORDER BY p.status DESC,p.updated_at DESC`;
        }
        if (req.body.sort == 1) {
            // 1 = by price DESC
            orderQuery = `ORDER BY p.price DESC,p.status DESC,p.updated_at DESC`;
        }
        if (req.body.sort == 2) {
            // 2 = by price ASC
            orderQuery = `ORDER BY p.price ASC,p.status DESC,p.updated_at DESC`;
        }
        if (req.body.sort == 3) {
            // 3 = FROM New products
            orderQuery = `ORDER BY p.status DESC,p.updated_at DESC`;
        }
        if (req.body.sort == 4) {
            // 4 = FROM Old products
            orderQuery = `ORDER BY p.status DESC,p.updated_at ASC`;
        }
    } else {
        orderQuery = `ORDER BY p.status DESC,p.updated_at DESC`;
    }

    let query = format(getProductsQuery, whereQuery, orderQuery);
    console.log(query)
    await db.query(query, [userId, limit, page])
        .then(result => {
            res.json(response(false, defaultMessage(), result.rows));
        }).catch(err => {
            badRequest(req, res);
        })
})

publicRouter.get('/search', verifyTokenWithNext, async (req, res) => {
    let userId = -1;
    if (typeof req.query === 'undefined' || typeof req.query == null || typeof req.query.page === 'undefined' || req.query.page == null || typeof req.query.query === 'undefined' || req.query.query == null) {
        badRequest(req, res);
        return;
    }
    let limit = 20;
    let page = req.query.page;
    if (typeof req.query.limit !== 'undefined' && req.query.limit != null) {
        limit = req.query.limit;
    }
    if (typeof req.user === 'undefined' || req.user == null) {
        userId = -1;
    } else {
        userId = req.user.user.id;
    }
    let english=cyrillicToTranslit.transform(req.query.query);
    let russian=cyrillicToTranslit.reverse(req.query.query);  
    await db.query(searchQuery, [userId, req.query.query,russian,english, limit, page])
        .then(result => {
            res.json(response(false, defaultMessage(), result.rows));
        })
        .catch(err => {
            res.send(err+"")
        })
})


publicRouter.get("/get-filter", (req, res) => {
    db.query(`${getCategoryFilter} ${getRegionFilter}`)
        .then(result => {
            res.json(response(false, defaultMessage(), {
                category: result[0].rows,
                regions: result[1].rows
            }))
        })
        .catch(err => {
            badRequest(req, res);
        })
})


// add product



const resizeImage = async (req, res, next) => {
    let largeFirstImage = '';
    if (typeof req.file !== 'undefined' && req.file != null) {
        createSmallImage(req.file.destination + "/" + req.file.filename, req.file.destination, req, res, next, 0, true);
    }

}

const createSmallImage = async (filename, destination, req, res, next, i, isFirst) => {
    let uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    sharp(filename)
        .rotate()
        .resize(200)
        .toFile("public/uploads/product/small/" + uniqueSuffix + ".png", (err, data) => {
            if (err) { console.error(err); return; }
            if (req.file.fieldname == first_image_large) {
                res.json(response(false, defaultMessage(), {
                    small_image: "public/uploads/product/small/" + uniqueSuffix + ".png",
                    large_image: filename,
                    is_first: true
                }))
            } else {
                res.json(response(false, defaultMessage(), {
                    small_image: "public/uploads/product/small/" + uniqueSuffix + ".png",
                    large_image: filename,
                    is_first: false
                }))
            }
            res.end();
        })
}





const addProductFunction = async (req, res) => {
    let userId = -1;
    if (typeof req.user === 'undefined' || req.user == null) {
        userId = -1;
        badRequest(req, res);
        return;
    }
    userId = req.user.user.id;

    let userInfo = await db.query(getUserById,[userId]);

    let status = 0;

    if(userInfo && userInfo.rows.length>0){
        let user = userInfo.rows[0];
        if(user.user_type==='master'){
            status = 4;
        }

        if(user.user_type==='vip'){
            status = 3;
        }
    }

    const { name, price, size, sub_category, phone_number, description } = req.body;

    if (typeof req.body.images === 'undefined' && req.body.images == null && req.body.images.length <= 0) {
        badRequest(req, res);
        return;
    }
    let images = req.body.images;
    await db.query(addProduct, [name, price, status, description, sub_category, userId, false, size, phone_number])
        .then(result => {
            if (typeof result.rows !== 'undefined') {
                if (result.rows.length) {
                    let insertedId = result.rows[0].id;
                    let values = [];
                    if (images.length > 0) {

                        images.forEach((image, i) => {
                            values.push([image.small_image, image.large_image, insertedId, image.is_first, 'now()', 'now()'])
                        })
                    }
                    db.query(format(addProductImage, values))
                        .then(imageResult => {
                            if (typeof imageResult !== 'undefined') {
                                if (imageResult.rows.length) {
                                    console.log("Error-0")
                                    result.rows[0].images = imageResult.rows;
                                    res.json(response(false, defaultMessage(), result.rows[0]));
                                    res.end();
                                } else {
                                    console.log("Error -2")
                                    res.json(response(false, errorMessage(), result.rows[0]));
                                    res.end();
                                }
                            } else {
                                console.log("Error -1")
                                res.json(response(false, errorMessage(), result.rows[0]));
                                res.end();
                            }
                        })
                        .catch(error => {
                            console.log("Error " + error)
                            res.json(response(false, error, result.rows[0]));
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
            res.send(error + "");
        })
}

const checkProductLimit = (req, res, next) => {
    db.query(getUserById, [req.user.user.id])
        .then(result => {
            if (result.rows[0].product_limit == "-1") {
                next();
            } else {
                if (result.rows[0].count_product < result.rows[0].product_limit) {
                    next();
                } else {
                    reachLimit(req, res);
                }
            }
        })
        .catch(error => {
            reachLimit(req, res);
        })
}

function startsWith(str, word) {
    return str.lastIndexOf(word, 0) === 0;
}

publicRouter.post('/get-verify-code', verifyUserToken, (req, res) => {
    if (typeof req.body === 'undefined' || req.body == null
        || typeof req.body.phoneNumber === 'undefined' || req.body.phoneNumber == null || req.body.phoneNumber == '' || !startsWith(req.body.phoneNumber, "+9936" || typeof req.body.type === 'undefined' || req.body.type == null)) {
        console.log("Error 1")
        badRequest(req, res);
        return;
    }
    let tm = `Tassyklaýjy kody ${req.body.phoneNumber} telefon belgisine ugradyldy`;
    let ru = `Код подтверждения отправлен на номер ${req.body.phoneNumber}`;
    let en = `Your verification code sent to ${req.body.phoneNumber}`;
    let seq = (Math.floor(Math.random() * 10000) + 10000).toString().substring(1);
    let text = `Siziň Elishi tassyklaýjy kodyňyz: ${seq}`;
    console.log(text);
    const data = {
        number: req.body.phoneNumber,
        text: text,
        code: seq
    }
    let final = response(false, message(tm, ru, en), data);

    db.query(insertPhoneVerification, [req.body.phoneNumber, seq])
        .then(result_insert => {
            if (result_insert.rows.length) {
                console.log(data);
                socket_io.emit('onMessage', data);
                res.json(final);
                res.end();
            } else {
                console.log("Error 2")
                badRequest(req, res);
            }
        })
        .catch(err => {
            console.log(err + "")
            badRequest(req, res);
        })
})

publicRouter.post('/add-product',
    verifyUserToken, checkProductLimit, addProductFunction);

publicRouter.post('/add-product-image',
    verifyUserToken, checkProductLimit, checkFolder_large, checkFolder_small,
    uploader.single(sliders_large), resizeImage);

publicRouter.post('/add-main-product-image',
    verifyUserToken, checkProductLimit, checkFolder_large, checkFolder_small,
    uploader.single(first_image_large), resizeImage);


// update product
const updateProduct = (req, res) => {
    let userId = -1;
    if (typeof req.user === 'undefined' || req.user == null) {
        userId = -1;
        badRequest(req, res);
        return;
    }
    userId = req.user.user.id;
    const { id, name, price, size, sub_category, description, isDangerous } = req.body;


    let newFirstImage='';
    let newsmallFirstImage = '';
    let newsliderImages = [];

    let oldlargeFirstImage = '';
    let oldsmallFirstImage = '';
    let oldsliderImages = [];

    let images = req.body.images;

    let imgValues = [];
    if (images.length > 0) {

        images.forEach((image, i) => {
            if(image.is_first){
                newFirstImage=image.large_image;
                newsmallFirstImage=image.small_image;
            } else {
                newsliderImages.push({
                    large:image.large_image,
                    small:image.small_image,
                    id:image.id})
            }
            imgValues.push([image.small_image, image.large_image, req.body.id, image.is_first, 'now()', 'now()'])
        })
    }


    if (typeof req.oldImages !== 'undefined' && req.oldImages.length) {
        req.oldImages.forEach((row, i) => {
            if (row.is_first) {
                oldlargeFirstImage = row.large_image;
                oldsmallFirstImage = row.small_image;
            } else {
                oldsliderImages.push({
                    large:row.large_image,
                    small:row.small_image,
                    id:row.id});
            }
        })
    }

    

    if (newFirstImage !== '' && oldlargeFirstImage !== newFirstImage) {
        console.log(oldlargeFirstImage+" / "+newFirstImage);
        try{
            fs.unlink(oldlargeFirstImage, (err, data) => { });
        } catch(e){}
        try{
            fs.unlink(oldsmallFirstImage, (err, data) => { });
        } catch(e){}
        db.query(deleteFirstImages, [id])
            .then(result => { })
            .catch(err => { });
    }

    let query = update_product_query_user;
    let values = [name, price, description, sub_category, size, id];
    if (isDangerous) {
        query = update_product_query_user_with_status;
        values = [name, price, description, sub_category, size, 0, id]
    }



    db.query(query, values)
        .then(result => {
            if (typeof result.rows !== 'undefined') {
                if (result.rows.length) {
                    // add product images section
                    if (imgValues.length > 0) {
                        db.query(format(addProductImage, imgValues))
                            .then(imageResult => {
                                if (typeof imageResult !== 'undefined') {
                                    if (imageResult.rows.length) {
                                        res.json(response(false, defaultMessage(), { product: result.rows, images: imageResult.rows }));
                                        res.end();
                                    } else {
                                        res.json(response(false, defaultMessage(), { product: result.rows }));
                                        res.end();
                                    }
                                } else {
                                    res.json(response(false, defaultMessage(), { product: result.rows }));
                                    res.end();
                                }
                            })
                            .catch(error => {
                                res.json(response(false, error, { product: result.rows }));
                                res.end();
                            })
                    } else {
                        res.json(response(false, defaultMessage(), { product: result.rows }));
                        res.end();
                    }


                } else {
                    res.status(400).json(response(false, errorMessage(), null));
                    res.end();
                }
            } else {
                res.status(400).json(response(false, errorMessage(), null));
                res.end();
            }
        })
        .catch(error => {
            res.status(400).json(response(false, errorMessage(), null));
            res.end();
        })
}

const getOldImagesFun = (req, res, next) => {
    let id = req.body.id;
    db.query(getOldImages, [id])
        .then(result => {
            req.oldImages = result.rows;
            next();
        })
        .catch(err => {
            next();
        })
}

publicRouter.put('/update-product',
    verifyUserToken,
    getOldImagesFun,
    updateProduct);

publicRouter.post('/delete-single-image',verifyUserToken,(req,res)=>{
    let userId = -1;
    if (typeof req.user === 'undefined' || req.user == null) {
        userId = -1;
        badRequest(req, res);
        return;
    }
    userId = req.user.user.id;
    if(typeof req.body === 'undefined' || req.body == null) {
        badRequest(req, res);
        return;
    }
    let image=req.body;
    try{
        fs.unlink(image.small_image, (err, data) => { });
        fs.unlink(image.large_image, (err, data) => { });
    } catch(err){}
    db.query(deleteImageById, [image.id])
    .then(result => { 
        res.json(response(false,defaultMessage(),"success"));
    })
    .catch(err => { 
        badRequest(req, res);
    });
})

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

const checkOwnProduct = (req, res, next) => {
    let userId = -1;
    if (typeof req.user === 'undefined' || req.user == null) {
        userId = -1;
        badRequest(req, res);
        return;
    }
    userId = req.user.user.id;
    db.query(getProductUserId,[req.params.id])
    .then(result => {
        if(result.rows[0].user_id==userId) {
            next();
        } else {
            badRequest(req, res);
        }
    })
    .catch(err => {
        badRequest(req, res);
    })

}


publicRouter.delete('/delete-product/:id', verifyUserToken,checkOwnProduct, deleteOldImages, (req, res) => {
    db.query(delete_product, [req.params.id])
        .then(result => {
            db.query(deleteProductImages, [req.params.id])
                .then(result2 => { })
                .catch(err => { })
            res.json(response(false, defaultMessage(), null));
            res.end();
        })
        .catch(error => {
            badRequest(req, res);
        })
})

// bring to front
publicRouter.post('/bring-to-front/:id',verifyUserToken,checkOwnProduct, (req, res) => {
    let userId = -1;
    if (typeof req.user === 'undefined' || req.user == null) {
        userId = -1;
        badRequest(req, res);
        return;
    }
    userId = req.user.user.id;
    if (typeof req.params.id === 'undefined' || req.params.id == null) {
        badRequest(req, res);
        return;
    }
    db.query(bringToFront, [req.params.id])
        .then(result => {
            if (result.rows.length) {
                res.json(response(false, defaultMessage(), result.rows));
            } else {
                badRequest(req, res);
            }
        })
        .catch(err => {
            badRequest(req, res);
        })
})





export { publicRouter };