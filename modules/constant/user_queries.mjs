// user queries
export const checkExistUser = `SELECT count(m.id) as count_exist FROM mobile_users m WHERE m.phone_number=$1;`;
export const getUserByPhoneNumber = `SELECT m.*,t.user_type,t.product_limit,d.district_name_tm,d.district_name_ru,d.district_name_en,d.region_id,r.region_name_tm,r.region_name_ru,r.region_name_en FROM mobile_users m
LEFT JOIN user_type t ON m.user_type_id = t.id
LEFT JOIN district d ON m.region_id = d.id
LEFT JOIN region r ON d.region_id = r.id
WHERE m.phone_number=$1;`;
export const getUserById = `SELECT m.*,t.user_type,t.product_limit,d.district_name_tm,d.district_name_ru,d.district_name_en,d.region_id,r.region_name_tm,r.region_name_ru,r.region_name_en,
(SELECT array_to_json(array_agg(p.*)) FROM product p WHERE p.user_id=$1) as user_products,
(SELECT array_to_json(array_agg(c.*))
	FROM congratulations c) as congratulations
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
// Locations
export const getLocations=`SELECT r.*,(SELECT array_to_json(array_agg(d.*)) FROM district d WHERE d.region_id = r.id) AS sub_locations FROM region r`;

// Constants
export const getConstantByType=`SELECT c.* FROM constant_page c WHERE c.page_type = $1`;

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
export const getHome=`SELECT now(),
(SELECT array_to_json(array_agg(b.*)) FROM banner b WHERE b.status!=0) AS banner,
(SELECT array_to_json(array_agg(s.*)) FROM category c INNER JOIN sub_category s ON c.id=s.category_id WHERE c.status!=0 AND c.is_main=true) AS category,
(SELECT array_to_json(array_agg(a.*)) FROM ads a WHERE a.status='home_large' OR a.status='home_mini') AS ads;`;
export const getEvents=`SELECT e.*,ev.*,
(SELECT array_to_json(array_agg(p.*)) FROM product p WHERE p.id = e.product_id ) AS product,
(SELECT array_to_json(array_agg(i.*)) FROM product_images i WHERE i.product_id = e.product_id) AS images
FROM event_products e INNER JOIN event ev ON ev.id=e.event_id ORDER BY e.updated_at DESC;`;