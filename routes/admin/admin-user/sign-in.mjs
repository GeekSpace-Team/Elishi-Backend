import jwt from 'jsonwebtoken';
import { badRequest, errorResponse, response, unauthorized } from "../../../modules/response.mjs";
import { db } from '../../../modules/database/connection.mjs'
import { login_query, updateToken } from '../../../modules/constant/admin_query.mjs';
import { secret_key } from '../../../modules/constant.mjs';

export const signIn = (req, res) => {
    if (req.body == null || Object.keys(req.body).length === 0) {
        badRequest(req, res);
    } else {
        const { username, password } = req.body;
        db.query(login_query, [username, password])
            .then(result => {
                if (result.rows.length) {
                    const user = {
                        id: result.rows[0].id,
                        user_type: result.rows[0].user_type
                    }

                    jwt.sign({ user }, secret_key, (err, token) => {
                        if (err) res.json(err+"");
                        db.query(updateToken, [token, user.id])
                            .then(updateResult => {
                                res.send(response(false, "success", {
                                    userId: user.id,
                                    token: token,
                                    user_type: user.user_type
                                }));
                                res.end();
                            })
                            .catch(err => {
                                badRequest(req, res);
                            })

                    })

                } else {
                    unauthorized(req, res);
                }
            })
            .catch(err => {
                res.status(500).json(errorResponse(err));
                res.end();
            })
    }
}