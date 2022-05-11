// user queries
export const checkExistUser = `SELECT count(m.id) as count_exist FROM mobile_users m WHERE m.phone_number=$1;`;
export const getUserByPhoneNumber = `SELECT m.*,t.user_type,t.product_limit,d.district_name_tm,d.district_name_ru,d.district_name_en,d.region_id,r.region_name_tm,r.region_name_ru,r.region_name_en FROM mobile_users m
LEFT JOIN user_type t ON m.user_type_id = t.id
LEFT JOIN district d ON m.region_id = d.id
LEFT JOIN region r ON d.region_id = r.id
WHERE m.phone_number=$1;`;
export const getUserById = `SELECT m.*,t.user_type,t.product_limit,d.district_name_tm,d.district_name_ru,d.district_name_en,d.region_id,r.region_name_tm,r.region_name_ru,r.region_name_en,
(SELECT array_to_json(array_agg(c.*))
	FROM congratulations c) as congratulations,
(SELECT count(p.id) AS count_product FROM product p WHERE p.user_id=m.id)
FROM mobile_users m
LEFT JOIN user_type t ON m.user_type_id = t.id
LEFT JOIN district d ON m.region_id = d.id
LEFT JOIN region r ON d.region_id = r.id
WHERE m.id=$1;`;
export const updateUserQuery = `UPDATE mobile_users
	SET fullname=$1, address=$2, region_id=$3, email=$4, notification_token=$5, gender=$6,profile_image=$7 updated_at=now()
	WHERE id = $8 RETURNING *;`;
export const updateUserQueryWithoutImage = `UPDATE mobile_users
	SET fullname=$1, address=$2, region_id=$3, email=$4, notification_token=$5, gender=$6, updated_at=now()
	WHERE id = $7 RETURNING *;`;

export const insertPhoneVerification = `INSERT INTO phone_verification(
	phone_number, code, created_at, updated_at)
	VALUES ($1, $2, now(), now()) RETURNING *;`;

export const checkVerification = `SELECT p.*,Extract(MINUTE FROM (now() - p.created_at)) as diff_min FROM phone_verification p WHERE p.phone_number=$1 AND p.code=$2 AND Extract(MINUTE FROM (now() - p.created_at))<=$3`;
export const checkVerification2 = `SELECT p.*,Extract(MINUTE FROM (now() - p.created_at)) as diff_min FROM phone_verification p WHERE p.phone_number=$1 AND Extract(MINUTE FROM (now() - p.created_at))<=$2`;
export const addUser = `INSERT INTO mobile_users(
	fullname, phone_number, user_type_id, region_id,notification_token, gender, status, created_at, updated_at, token)
	VALUES ($1,$2,$3,2,$4,1,1,now(),now(),$5);`;
export const getUserProducts=`SELECT
p.*,u.fullname,r.region_name_tm,r.region_name_ru,r.region_name_en,d.district_name_tm,d.district_name_ru,d.district_name_en,u.fullname,u.address,u.profile_image,u.email,u.gender,u.phone_number as user_phone_number,sub.sub_category_name_en,t.user_type,t.product_limit,
(SELECT count(f.id) FROM favorite f WHERE f.product_id=p.id AND f.user_id=p.user_id) AS isFav,
(SELECT array_to_json(array_agg(i.*)) FROM product_images i WHERE i.product_id = p.id) AS images
FROM product p LEFT JOIN mobile_users u ON u.id = p.user_id
LEFT JOIN sub_category sub ON sub.id = p.sub_category_id 
LEFT JOIN user_type t ON t.id=u.user_type_id
LEFT JOIN district d ON d.id=u.region_id
LEFT JOIN region r ON r.id=d.region_id
WHERE p.user_id=$1
ORDER BY p.updated_at DESC;`;
// Locations
export const getLocations=`SELECT r.*,(SELECT array_to_json(array_agg(d.*)) FROM district d WHERE d.region_id = r.id) AS sub_locations FROM region r`;

// Constants
export const getConstantByType=`SELECT c.* FROM constant_page c WHERE c.page_type = $1`;
export const getConstantById=`SELECT c.* FROM constant_page c WHERE c.id = $1`;

// Category
export const getCategory=`SELECT c.*,
(SELECT array_to_json(array_agg(s.*)) FROM sub_category s WHERE s.category_id=c.id) as sub_category
FROM category c ORDER BY created_at DESC;`;

// Favorite
export const addFavorite = `INSERT INTO favorite(
	user_id, product_id, created_at, updated_at)
	VALUES ($1, $2, now(), now()) RETURNING *;`;
export const checkFavorite = `SELECT f.*,count(f.id) as fav_count FROM favorite f WHERE f.user_id=$1 AND f.product_id=$2 GROUP BY f.id;`;
export const deleteFavorite = `DELETE FROM favorite f WHERE f.user_id=$1 AND f.product_id=$2`;
export const getFavorite = `SELECT f.id AS fav_id,f.product_id,f.user_id,p.*,(SELECT array_to_json(array_agg(i.*)) FROM product_images i WHERE i.product_id=f.product_id) AS images
FROM favorite f
LEFT JOIN product p ON f.product_id=p.id
WHERE f.user_id=$1 ORDER BY f.updated_at DESC LIMIT $2 OFFSET ($3 - 1) * $2;`;
// Congratulations
export const getCongratulations = `SELECT c.*,h.holiday_name_tm,h.holiday_name_ru,h.holiday_name_en
FROM congratulations c
LEFT JOIN holiday h ON c.holiday_id=h.id
ORDER BY c.updated_at DESC LIMIT $1 OFFSET ($2 - 1) * $1;`;
export const getCongratulationsWithCondition = `SELECT c.*,h.holiday_name_tm,h.holiday_name_ru,h.holiday_name_en
FROM congratulations c
LEFT JOIN holiday h ON c.holiday_id=h.id
WHERE c.holiday_id = $1
ORDER BY c.updated_at DESC LIMIT $2 OFFSET ($3 - 1) * $2`;
export const getHoliday = `SELECT h.* FROM holiday h`;

// Home
export const getHome=`	SELECT json_build_object(
	'home',json_build_object(
		'banners',(SELECT array_to_json(array_agg(b.*)) FROM banner b WHERE b.status!=0),
		'category',(SELECT array_to_json(array_agg(c.*)) FROM category c WHERE c.status!=0 AND c.is_main=true),
		'ads',(SELECT array_to_json(array_agg(a.*)) FROM ads a WHERE a.status='home_large' OR a.status='home_mini'),
		'vip_users',(SELECT array_to_json(array_agg(m.*)) FROM mobile_users m LEFT JOIN user_type ut ON m.user_type_id=ut.id WHERE ut.user_type='vip'),
		'events',(SELECT array_to_json(array_agg(e.*)) FROM event e WHERE e.is_main=1 AND e.status!=0 AND e.event_type!='products'),
		'collections',(SELECT array_to_json(array_agg(e.*)) FROM event e WHERE e.is_main=1 AND e.status!=0 AND e.event_type='products')
	)
);`;
export const getProductById=`SELECT
p.*,u.fullname,r.region_name_tm,r.region_name_ru,r.region_name_en,d.district_name_tm,d.district_name_ru,d.district_name_en,u.fullname,u.address,u.profile_image,u.email,u.gender,u.phone_number as user_phone_number,sub.sub_category_name_en,sub.sub_category_name_ru,sub.sub_category_name_tm,t.user_type,t.product_limit,
(SELECT count(f.id) FROM favorite f WHERE f.product_id=p.id AND f.user_id=$1) AS isFav,
(SELECT array_to_json(array_agg(i.*)) FROM product_images i WHERE i.product_id = p.id) AS images
FROM product p LEFT JOIN mobile_users u ON u.id = p.user_id
LEFT JOIN sub_category sub ON sub.id = p.sub_category_id 
LEFT JOIN user_type t ON t.id=u.user_type_id
LEFT JOIN district d ON d.id=u.region_id
LEFT JOIN region r ON r.id=d.region_id
WHERE p.id=$2 ORDER BY p.updated_at;`;

export const getBanners=`SELECT b.* FROM banner b WHERE b.status!=0 ORDER BY b.order DESC;`;
export const getMainCategory=`SELECT c.* FROM category c WHERE c.status!=0 AND c.is_main=true ORDER BY c.updated_at DESC;`;
export const getAds=`SELECT a.* FROM ads a WHERE a.status='home_large' OR a.status='home_mini' ORDER BY a.updated_at DESC;`;
export const vipUser=`SELECT m.*,ut.user_type,ut.product_limit FROM mobile_users m LEFT JOIN user_type ut ON m.user_type_id=ut.id WHERE ut.user_type='vip' ORDER BY m.updated_at DESC;`;
export const getEvents=`SELECT e.* FROM event e WHERE e.is_main=1 AND e.status!=0 AND e.event_type!='products' ORDER BY e.updated_at DESC;`;
export const getNewProducts=`SELECT
p.*,u.fullname,r.region_name_tm,r.region_name_ru,r.region_name_en,d.district_name_tm,d.district_name_ru,d.district_name_en,u.fullname,u.address,u.profile_image,u.email,u.gender,u.phone_number as user_phone_number,sub.sub_category_name_en,t.user_type,t.product_limit,
(SELECT count(f.id) FROM favorite f WHERE f.product_id=p.id AND f.user_id=%s) AS isFav,
(SELECT array_to_json(array_agg(i.*)) FROM product_images i WHERE i.product_id = p.id) AS images
FROM product p LEFT JOIN mobile_users u ON u.id = p.user_id
LEFT JOIN sub_category sub ON sub.id = p.sub_category_id 
LEFT JOIN user_type t ON t.id=u.user_type_id
LEFT JOIN district d ON d.id=u.region_id
LEFT JOIN region r ON r.id=d.region_id
WHERE p.status!=0 ORDER BY p.updated_at DESC LIMIT 30;`;
export const getTrendProducts=`SELECT
p.*,u.fullname,r.region_name_tm,r.region_name_ru,r.region_name_en,d.district_name_tm,d.district_name_ru,d.district_name_en,u.fullname,u.address,u.profile_image,u.email,u.gender,u.phone_number as user_phone_number,sub.sub_category_name_en,t.user_type,t.product_limit,
(SELECT count(f.id) FROM favorite f WHERE f.product_id=p.id AND f.user_id=%s) AS isFav,
(SELECT array_to_json(array_agg(i.*)) FROM product_images i WHERE i.product_id = p.id) AS images
FROM product p LEFT JOIN mobile_users u ON u.id = p.user_id
LEFT JOIN sub_category sub ON sub.id = p.sub_category_id 
LEFT JOIN user_type t ON t.id=u.user_type_id
LEFT JOIN district d ON d.id=u.region_id
LEFT JOIN region r ON r.id=d.region_id
WHERE p.status!=0 AND p.is_popular=true ORDER BY p.updated_at DESC LIMIT 30;`;
export const getCollections=`SELECT e.*,(SELECT array_to_json(array_agg(ep.product_id)) FROM event_products ep WHERE ep.event_id=e.id) AS collections FROM event e WHERE e.is_main=1 AND e.status!=0 AND e.event_type='products' ORDER BY e.updated_at DESC;`;
export const getEventProducts=`SELECT
p.*,u.fullname,r.region_name_tm,r.region_name_ru,r.region_name_en,d.district_name_tm,d.district_name_ru,d.district_name_en,u.fullname,u.address,u.profile_image,u.email,u.gender,u.phone_number as user_phone_number,sub.sub_category_name_en,t.user_type,t.product_limit,
(SELECT count(f.id) FROM favorite f WHERE f.product_id=p.id AND f.user_id=%s) AS isFav,
(SELECT array_to_json(array_agg(i.*)) FROM product_images i WHERE i.product_id = p.id) AS images
FROM product p LEFT JOIN mobile_users u ON u.id = p.user_id
LEFT JOIN sub_category sub ON sub.id = p.sub_category_id 
LEFT JOIN user_type t ON t.id=u.user_type_id
LEFT JOIN district d ON d.id=u.region_id
LEFT JOIN region r ON r.id=d.region_id
WHERE p.status!=0 AND p.id IN (%L) ORDER BY p.updated_at DESC LIMIT 30;`;
export const getDeviceVersion = `SELECT value,type
FROM vars WHERE type=$1 OR type=$2;`;
export const getSimilarProducts=`SELECT
p.*,u.fullname,r.region_name_tm,r.region_name_ru,r.region_name_en,d.district_name_tm,d.district_name_ru,d.district_name_en,u.fullname,u.address,u.profile_image,u.email,u.gender,u.phone_number as user_phone_number,sub.sub_category_name_en,t.user_type,t.product_limit,
(SELECT count(f.id) FROM favorite f WHERE f.product_id=p.id AND f.user_id=$1) AS isFav,
(SELECT array_to_json(array_agg(i.*)) FROM product_images i WHERE i.product_id = p.id) AS images
FROM product p LEFT JOIN mobile_users u ON u.id = p.user_id
LEFT JOIN sub_category sub ON sub.id = p.sub_category_id 
LEFT JOIN user_type t ON t.id=u.user_type_id
LEFT JOIN district d ON d.id=u.region_id
LEFT JOIN region r ON r.id=d.region_id
WHERE p.status!=0 AND p.sub_category_id=$2 ORDER BY p.updated_at DESC LIMIT 18;`;

export const getProductUserId=`SELECT p.user_id FROM product p WHERE p.id=$1`;

export const getProductsQuery=`SELECT
p.*,u.fullname,r.region_name_tm,r.region_name_ru,r.region_name_en,d.district_name_tm,d.district_name_ru,d.district_name_en,u.fullname,u.address,u.profile_image,u.email,u.gender,u.phone_number as user_phone_number,sub.sub_category_name_en,sub.sub_category_name_ru,sub.sub_category_name_tm,t.user_type,t.product_limit,
(SELECT count(f.id) FROM favorite f WHERE f.product_id=p.id AND f.user_id=$1) AS isFav,
(SELECT array_to_json(array_agg(i.*)) FROM product_images i WHERE i.product_id = p.id) AS images
FROM product p LEFT JOIN mobile_users u ON u.id = p.user_id
LEFT JOIN sub_category sub ON sub.id = p.sub_category_id 
LEFT JOIN user_type t ON t.id=u.user_type_id
LEFT JOIN district d ON d.id=u.region_id
LEFT JOIN region r ON r.id=d.region_id
%s
%s
LIMIT $2 OFFSET ($3 - 1) * $2;`;

export const searchQuery=`SELECT
p.*,u.fullname,r.region_name_tm,r.region_name_ru,r.region_name_en,d.district_name_tm,d.district_name_ru,d.district_name_en,u.fullname,u.address,u.profile_image,u.email,u.gender,u.phone_number as user_phone_number,sub.sub_category_name_en,t.user_type,t.product_limit,
(SELECT count(f.id) FROM favorite f WHERE f.product_id=p.id AND f.user_id=$1) AS isFav,
(SELECT array_to_json(array_agg(i.*)) FROM product_images i WHERE i.product_id = p.id) AS images
FROM product p LEFT JOIN mobile_users u ON u.id = p.user_id
LEFT JOIN sub_category sub ON sub.id = p.sub_category_id 
LEFT JOIN user_type t ON t.id=u.user_type_id
LEFT JOIN district d ON d.id=u.region_id
LEFT JOIN region r ON r.id=d.region_id
LEFT JOIN category c ON c.id=sub.category_id
WHERE p.status != 0 AND (p.product_name ILIKE '%' || $2 || '%'
 OR p.description ILIKE '%' || $2 || '%' 
 OR p.size ILIKE '%' || $2 || '%'
 OR u.fullname ILIKE '%' || $2 || '%'
 OR r.region_name_tm ILIKE '%' || $2 || '%'
 OR r.region_name_ru ILIKE '%' || $2 || '%'
 OR r.region_name_en ILIKE '%' || $2 || '%'
 OR d.district_name_tm ILIKE '%' || $2 || '%'
 OR d.district_name_ru ILIKE '%' || $2 || '%'
 OR d.district_name_en ILIKE '%' || $2 || '%'
 OR sub.sub_category_name_en ILIKE '%' || $2 || '%'
 OR sub.sub_category_name_ru ILIKE '%' || $2 || '%'
 OR sub.sub_category_name_tm ILIKE '%' || $2 || '%'
 OR c.category_name_tm ILIKE '%' || $2 || '%'
 OR c.category_name_ru ILIKE '%' || $2 || '%'
 OR c.category_name_en ILIKE '%' || $2 || '%'
 
 OR
 p.product_name ILIKE '%' || $3 || '%'
 OR p.description ILIKE '%' || $3 || '%' 
 OR p.size ILIKE '%' || $3 || '%'
 OR u.fullname ILIKE '%' || $3 || '%'

 OR
 p.product_name ILIKE '%' || $4 || '%'
 OR p.description ILIKE '%' || $4 || '%' 
 OR p.size ILIKE '%' || $4 || '%'
 OR u.fullname ILIKE '%' || $4 || '%'

 )
ORDER BY p.status DESC,p.updated_at DESC
LIMIT $5 OFFSET ($6 - 1) * $5;`;

export const getSubCategoryCon=`SELECT s.id FROM sub_category s WHERE s.category_id=$1;`;

export const getCategoryFilter=`SELECT s.* FROM sub_category s WHERE s.status!=0 ORDER BY s.updated_at;`;
export const getRegionFilter=`SELECT d.* FROM district d ORDER BY id DESC;`;

export const bringToFront = `UPDATE product SET updated_at=now() WHERE id=$1 RETURNING *`;

export const updateUser = `UPDATE mobile_users
	SET fullname=$1, address=$2, region_id=$3, email=$4, gender=$5, updated_at=now()
	WHERE id = $6 RETURNING *;`;

export const updateUserNotificationToken = `UPDATE mobile_users
	SET notification_token=$1
	WHERE id = $2 RETURNING *;`;
	
export const updateUserImage = `UPDATE mobile_users
	SET profile_image=$1
	WHERE id = $2 RETURNING *;`;

export const getAdsProducts=`SELECT a.* FROM ads a WHERE a.status='products' ORDER BY random();`;

export const getAdsSingleProduct=`SELECT a.* FROM ads a WHERE a.status='product_large' ORDER BY random();`;