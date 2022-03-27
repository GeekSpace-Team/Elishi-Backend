import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../modules/auth/token.mjs';
import { forbidden, unauthorized } from '../modules/response.mjs';

const router = express.Router();

router.get('/', (req, res) => {
    res.send(`User List ${req.query.name}`);
})

router.get('/new', (req, res) => {
    res.send("New user");
})

router.post('/signin',(req, res)=>{
    const user = {
        id:Date.now(),
        userMail:'example@gmail.com',
        password:'123'
    }

    jwt.sign({user},'secretkey',(err,token)=>{
        res.json({token:token});
    })
})

router.get('/profile',verifyToken,(req,res)=>{
    jwt.verify(req.token,'secretkey',(err,authData)=>{
        if(err){
            unauthorized(req, res);
        } else {
            res.json({
                message:'Welcome to profile',
                userData:authData
            })
        }
    })
})



router.route('/:id')
    .get((req, res) => {
        console.log(req.user);
        res.send(`User with id ${req.params.id}`);
    })
    .put((req, res) => {
        res.send(`Update with id ${req.params.id}`);
    })
    .delete((req, res) => {
        res.send(`Delete with id ${req.params.id}`);
    })

router.param("id", (req, res, next, id) => {
    console.log(id);
    req.user="Hello from before"
    next();
})


export const userRouter = router;