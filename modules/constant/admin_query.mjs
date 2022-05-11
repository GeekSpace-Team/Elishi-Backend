// login queries
    export const login_query = `SELECT admin_user.*,user_type.user_type FROM admin_user left join user_type on admin_user.user_type_id=user_type.id 
    WHERE admin_user.username=$1 and admin_user.password=$2 LIMIT 1`;
    export const updateToken = "UPDATE admin_user SET token=$1 WHERE id=$2";

// category queries
    export const addCategory = `INSERT INTO category(
	category_name_tm, category_name_ru, category_name_en, status, is_main, image, created_at,updated_at)
	VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())  RETURNING *`;
    export const getCategory = `SELECT * FROM category ORDER BY updated_at DESC`;
    export const deleteCategory = `DELETE FROM category WHERE id = $1`;
    export const updateCategory = `UPDATE category
	SET category_name_tm=$1, category_name_ru=$2, category_name_en=$3, status=$4, updated_at=now(), is_main=$5
	WHERE id=$6  RETURNING *`;
    export const updateCategoryWithImage = `UPDATE category
	SET category_name_tm=$1, category_name_ru=$2, category_name_en=$3, status=$4, updated_at=now(), is_main=$5,image=$6
	WHERE id=$7  RETURNING *`;
    export const deleteCategoryImage = "SELECT image FROM category WHERE id=$1";
// sub category queries
    export const add_sub_category_query = `INSERT INTO sub_category(
        sub_category_name_tm, sub_category_name_ru, sub_category_name_en, category_id, status, image, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, now(),now())  RETURNING *`;
    export const get_sub_category_with_condition = "SELECT s.*,c.category_name_tm FROM sub_category as s left join category as c on s.category_id=c.id WHERE s.category_id=$1 ORDER BY updated_at DESC";
    export const get_sub_category_without_condition = "SELECT s.*,c.category_name_tm FROM sub_category as s left join category as c on s.category_id=c.id ORDER BY updated_at DESC";
    export const deleteSubCategory = `DELETE FROM sub_category WHERE id = $1`;
    export const updateSubCategoryWithImage = `UPDATE sub_category
	SET sub_category_name_tm=$1, sub_category_name_ru=$2, sub_category_name_en=$3, category_id=$4, status=$5, updated_at=now(), image=$6
	WHERE id=$7 RETURNING *`;
    export const updateSubCategoryWithoutImage = `UPDATE sub_category
	SET sub_category_name_tm=$1, sub_category_name_ru=$2, sub_category_name_en=$3, category_id=$4, status=$5, updated_at=now()
	WHERE id=$6 RETURNING *`;
    export const deleteSubCategoryImage = "SELECT image FROM sub_category WHERE id=$1";

// PRODUCT QUERIES
    export const addProduct = `INSERT INTO product(
        product_name, price, status, description, sub_category_id, user_id, is_popular, size, phone_number, updated_at, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now()) RETURNING *`;
    export const getProduct = `SELECT
    p.*,u.fullname,u.phone_number as user_phone_number,sub.sub_category_name_en,t.user_type,t.product_limit,
    (SELECT array_to_json(array_agg(i.*)) FROM product_images i WHERE i.product_id = p.id) AS images
    FROM product p LEFT JOIN mobile_users u ON u.id = p.user_id
    LEFT JOIN sub_category sub ON sub.id = p.sub_category_id 
    LEFT JOIN user_type t ON t.id=u.user_type_id `;
    export const getProductCount = `SELECT count(p.id) as page_count FROM product p`;
    export const delete_product = `DELETE FROM product WHERE id = $1;`;
    export const update_product_query = `UPDATE product
	SET product_name=$1, price=$2, status=$3, description=$4, sub_category_id=$5, user_id=$6, is_popular=$7, size=$8, phone_number=$9, updated_at=now(),cancel_reason=$11
	WHERE id=$10 RETURNING *;`;
    export const update_product_query_user = `UPDATE product
	SET product_name=$1, price=$2, description=$3, sub_category_id=$4, size=$5, updated_at=now()
	WHERE id=$6 RETURNING *;`;
    export const update_product_query_user_with_status = `UPDATE product
	SET product_name=$1, price=$2, description=$3, sub_category_id=$4, size=$5,status=$6, updated_at=now()
	WHERE id=$7 RETURNING *;`;
    export const changeUserProductStatuses = `UPDATE product SET status=$1,updated_at=now() WHERE user_id=$2 RETURNING *`;
    export const changeProductStatusById = `UPDATE product SET status=$1,cancel_reason=$2,updated_at=now() WHERE id=$3 RETURNING *`;

// PRODUCT IMAGES QUERIES
    export const addProductImage = `INSERT INTO product_images(
        small_image, large_image, product_id, "is_first", created_at, updated_at)
        VALUES %L  RETURNING *`;
    export const getOldImages = `SELECT small_image,large_image,is_first FROM product_images WHERE product_id = $1`;
    export const deleteProductImages = `DELETE FROM product_images WHERE product_id = $1;`;
    export const deleteFirstImages = `DELETE FROM product_images WHERE product_id = $1 and is_first = true;`;
    export const deleteNotFirstImages = `DELETE FROM product_images WHERE product_id = $1 and is_first = false;`;
    export const deleteImageById = `DELETE FROM product_images WHERE id = $1`;

// User queries
    export const addUserQuery = `INSERT INTO mobile_users(
        fullname, address, phone_number, profile_image, user_type_id, region_id, email, notification_token, gender, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now())  RETURNING *;`;
    
    export const getUserQueryWithCondition = `SELECT m.*,t.user_type,t.product_limit,d.district_name_tm FROM mobile_users m
	LEFT JOIN user_type t ON m.user_type_id = t.id
	LEFT JOIN district d ON m.region_id = d.id
	WHERE m.fullname ILIKE '%' || $1 || '%' 
    OR
    m.phone_number ILIKE '%' || $1 || '%' 
    OR
    m.address ILIKE '%' || $1 || '%'
    OR
    m.email ILIKE '%' || $1 || '%'
    OR
    d.district_name_tm ILIKE '%' || $1 || '%'
    OR
    d.district_name_ru ILIKE '%' || $1 || '%'
    OR
    d.district_name_en ILIKE '%' || $1 || '%'
    OR
    t.user_type ILIKE '%' || $1 || '%'
    ORDER BY updated_at DESC LIMIT $2 OFFSET ($3 - 1) * $2;`;
    export const getUserQueryWithoutCondition = `SELECT m.*,t.user_type,t.product_limit,d.district_name_tm FROM mobile_users m
	LEFT JOIN user_type t ON m.user_type_id = t.id
	LEFT JOIN district d ON m.region_id = d.id
	ORDER BY updated_at DESC LIMIT $1 OFFSET ($2 - 1) * $1;`;
    export const getUserImage = `SELECT profile_image FROM mobile_users WHERE id = $1`;
    export const deleteUser = `DELETE FROM mobile_users WHERE id = $1`;
    export const updateUserQuery = `UPDATE mobile_users
	SET fullname=$1, address=$2, phone_number=$3, profile_image=$4, user_type_id=$5, region_id=$6, email=$7, notification_token=$8, gender=$9, status=$10, updated_at=now()
	WHERE id = $11 RETURNING *;`;
    export const updateUserQueryWithoutImage = `UPDATE mobile_users
	SET fullname=$1, address=$2, phone_number=$3, user_type_id=$4, region_id=$5, email=$6, notification_token=$7, gender=$8, status=$9, updated_at=now()
	WHERE id = $10 RETURNING *;`;
    export const getAllUsers = `SELECT id,fullname,notification_token FROM mobile_users ORDER BY updated_at DESC`;
    export const getUserCountWithCondition = `SELECT count(m.id) as page_count FROM mobile_users m 
    LEFT JOIN user_type t ON m.user_type_id = t.id
	LEFT JOIN district d ON m.region_id = d.id
	WHERE m.fullname ILIKE '%' || $1 || '%' 
    OR
    m.phone_number ILIKE '%' || $1 || '%' 
    OR
    m.address ILIKE '%' || $1 || '%'
    OR
    m.email ILIKE '%' || $1 || '%'
    OR
    d.district_name_tm ILIKE '%' || $1 || '%'
    OR
    d.district_name_ru ILIKE '%' || $1 || '%'
    OR
    d.district_name_en ILIKE '%' || $1 || '%'
    OR
    t.user_type ILIKE '%' || $1 || '%';`
    export const getUserCountWithoutCondition = `SELECT count(m.id) as page_count FROM mobile_users m;`
    export const updateUserToken = `UPDATE mobile_users SET token = $1 WHERE id=$2 RETURNING *`;
    export const getUserById = `SELECT * FROM mobile_users WHERE id = $1`;
    // Banner queries
    export const addBanner = `INSERT INTO banner(
        banner_image_tm, banner_image_ru, banner_image_en, "order", status, "siteURL", created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, now(), now()) RETURNING *`;
    export const getBanner = "SELECT * FROM banner ORDER BY updated_at DESC";
    export const deleteBanner = "DELETE FROM banner WHERE id = $1";
    export const deleteBannerImage = "SELECT banner_image_tm,banner_image_ru,banner_image_en from banner WHERE id=$1";
    export const updateBanner = `UPDATE banner
	SET banner_image_tm=$1, banner_image_ru=$2, banner_image_en=$3, "order"=$4, "status"=$5, "siteURL"=$6, updated_at=now()
	WHERE id=$7 RETURNING *`;

//  Holiday queries
    export const addHoliday = `INSERT INTO holiday(
        holiday_name_tm, holiday_name_ru, holiday_name_en,created_at,updated_at)
        VALUES ($1, $2, $3,now(),now()) RETURNING *;`;
    export const getHoliday = `SELECT * FROM holiday order by updated_at DESC`;
    export const deleteHoliday = `DELETE FROM holiday WHERE id=$1`;
    export const updateHoliday = `UPDATE holiday
	SET holiday_name_tm=$1, holiday_name_ru=$2, holiday_name_en=$3, updated_at=now()
	WHERE id=$4 RETURNING *;`;

//  Congratulation queries
    export const addCongratulation = `INSERT INTO congratulations(
        text, status, user_id, holiday_id, title, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, now(), now()) RETURNING *;`;
    export const getCongratulationWithCondition = `SELECT c.*,h.holiday_name_tm,m.fullname,m.phone_number FROM congratulations c
    LEFT JOIN holiday h ON h.id=c.holiday_id
    LEFT JOIN mobile_users m ON m.id=c.user_id
    WHERE c.holiday_id = $1
    ORDER BY c.updated_at DESC LIMIT $2 OFFSET ($3 - 1) * $2;`;
    export const getCongratulationWithoutCondition = `SELECT c.*,h.holiday_name_tm,m.fullname,m.phone_number FROM congratulations c
    LEFT JOIN holiday h ON h.id=c.holiday_id
    LEFT JOIN mobile_users m ON m.id=c.user_id
    ORDER BY c.updated_at DESC LIMIT $1 OFFSET ($2 - 1) * $1;`;
    export const getCongratulationWithoutConditionCount = `SELECT count(c.id) as page_count FROM congratulations c
    LEFT JOIN holiday h ON h.id=c.holiday_id
    LEFT JOIN mobile_users m ON m.id=c.user_id;`;
    export const getCongratulationWithConditionCount = `SELECT count(c.id) as page_count FROM congratulations c
    LEFT JOIN holiday h ON h.id=c.holiday_id
    LEFT JOIN mobile_users m ON m.id=c.user_id WHERE c.holiday_id = $1;`;
    export const deleteCongratulations = `DELETE FROM congratulations WHERE id = $1`;
    export const updateCongratulations = `UPDATE congratulations
	SET text=$1, status=$2, user_id=$3, holiday_id=$4, title=$5, updated_at=now()
	WHERE id=$6 RETURNING *;`;

//  Constant pages queries
    export const addConstant = `INSERT INTO constant_page(
        "titleTM", "titleRU", "titleEN", content_light_tm, content_light_ru, content_light_en, content_dark_tm, content_dark_ru, content_dark_en, page_type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now(), now()) RETURNING *;`;
    export const getConstants = `SELECT * FROM constant_page ORDER BY updated_at DESC`;
    export const deleteConstants = `DELETE FROM constant_page WHERE id = $1`;
    export const updateConstant = `UPDATE constant_page
	SET "titleTM"=$1, "titleRU"=$2, "titleEN"=$3, content_light_tm=$4, content_light_ru=$5, content_light_en=$6, content_dark_tm=$7, content_dark_ru=$8, content_dark_en=$9, page_type=$10, updated_at=now()
	WHERE id=$11 RETURNING *;`;


//  User type queries
    export const addUserType = `INSERT INTO user_type(
        user_type, product_limit)
        VALUES ($1, $2) RETURNING *;`;
    export const getUserType = `SELECT * FROM user_type ORDER BY id DESC`;
    export const deleteUserType = `DELETE FROM user_type WHERE id = $1`;
    export const updateUserType = `UPDATE user_type
	SET user_type=$1, product_limit=$2
	WHERE id=$3 RETURNING *;`;

//  Region queries
    export const addRegion = `INSERT INTO region(
        region_name_tm, region_name_ru, region_name_en)
        VALUES ($1, $2, $3) RETURNING *;`;
    export const getRegion = `SELECT * FROM region ORDER BY id DESC`;
    export const deleteRegion = `DELETE FROM region WHERE id = $1`;
    export const updateRegion = `UPDATE region
	SET region_name_tm=$1, region_name_ru=$2, region_name_en=$3
	WHERE id = $4 RETURNING *;`;

//  District queries
    export const addDistrictQuery = `INSERT INTO district(
        district_name_tm, district_name_ru, district_name_en, region_id)
        VALUES ($1, $2, $3, $4) RETURNING *;`;
    export const getDistrict = `SELECT d.*,r.region_name_tm FROM district d LEFT JOIN region r ON d.region_id = r.id ORDER BY id DESC`;
    export const deleteDistrict = `DELETE FROM district WHERE id = $1`;
    export const updateDistrict = `UPDATE district
	SET district_name_tm=$1, district_name_ru=$2, district_name_en=$3, region_id=$4
	WHERE id=$5 RETURNING *;`;

//  Vars queries
    export const addVars = `INSERT INTO vars(
        type, value)
        VALUES ($1, $2) RETURNING *;`;
    export const getVars = `SELECT * FROM vars ORDER BY id DESC`;
    export const deleteVars = `DELETE FROM vars WHERE id=$1`;
    export const updateVars = `UPDATE public.vars
	SET value=$1
	WHERE type=$2 RETURNING *;`;

//  Event queries
    export const addEvent = `INSERT INTO event(
        title_tm, title_ru, title_en, event_image, url, "is_main", status, created_at, updated_at,event_type,go_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now(),$8,$9) RETURNING *;`;
    export const getEvents = `SELECT * FROM event ORDER BY updated_at DESC`;
    export const deleteEvent = `DELETE FROM event WHERE id=$1`;
    export const updateEvent = `UPDATE event
	SET title_tm=$1, title_ru=$2, title_en=$3, event_image=$4, url=$5, "is_main"=$6, status=$7, updated_at=now(),event_type=$8,go_id=$9
	WHERE id=$10 RETURNING *;`;
    export const updateEventWithoutImage = `UPDATE event
	SET title_tm=$1, title_ru=$2, title_en=$3, url=$4, "is_main"=$5, status=$6, updated_at=now(),event_type=$7,go_id=$8
	WHERE id=$9 RETURNING *;`;
    export const deleteEventImage = "SELECT event_image FROM event WHERE id=$1";
    

    // Event products
    export const addProductToEvent = `INSERT INTO event_products(
        product_id, created_at, updated_at, event_id)
        VALUES %L RETURNING *;`;
    export const removeProductFromEvent = `DELETE FROM event_products WHERE id=$1`;
    export const getEventProducts = `SELECT e.*,
    (SELECT array_to_json(array_agg(p.*)) FROM product p WHERE p.id = e.product_id ) AS product,
	(SELECT array_to_json(array_agg(i.*)) FROM product_images i WHERE i.product_id = e.product_id) AS images
	FROM event_products e WHERE event_id = $1 ORDER BY e.updated_at DESC`;



    // Ads queries
    export const addAdsQuery = `INSERT INTO ads(
        ads_image, constant_id, site_url,created_at,updated_at,status)
        VALUES ($1, $2, $3,now(),now(),$4) RETURNING *;`;
    export const getAdsQuery = `SELECT * FROM ads ORDER BY updated_at DESC`;
    export const deleteAdsQuery = `DELETE FROM ads WHERE id = $1`;
    export const deleteAdsImage = "SELECT ads_image FROM ads WHERE id=$1";
    export const updateAdsWithImage = `UPDATE ads
	SET ads_image=$1, constant_id=$2, site_url=$3, updated_at=now(),status=$4
	WHERE id=$5 RETURNING *;`;
    export const updateAdsWithoutImage = `UPDATE ads
	SET constant_id=$1, site_url=$2, updated_at=now(),status=$3
	WHERE id=$4 RETURNING *;`;
    // test queries
    export const getNow = "SELECT now()";

    // Add to black list
    export const addBlackList = `INSERT INTO blocked_ip(
        ip_addr, created_at, updated_at, status)
        VALUES ($1, now(), now(), 1) RETURNING *;`;
    export const getBlackList = `SELECT * FROM blocked_ip WHERE status=1`;
    export const getBlackList2 = `SELECT * FROM blocked_ip`;