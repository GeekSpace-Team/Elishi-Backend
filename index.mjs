import express from 'express';
import rateLimit from 'express-rate-limit';
import { db } from './modules/database/connection.mjs';
import { badRequest, response } from './modules/response.mjs';
import { router } from './routes/router.mjs';
import { userRouter } from './routes/tempUser.mjs';
import cors from 'cors';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { secret_key } from "./modules/constant.mjs";
import requestIp from 'request-ip';
import { Server } from "socket.io";
import ipfilter from 'express-ipfilter';
import { blocked_ip } from './modules/blacklist/blacklist.mjs';
import { addBlackList, getBlackList } from './modules/constant/admin_query.mjs';
import { verifyToken } from './modules/auth/token.mjs';

const app = express();
const rateHandler = () => {
    console.log("OK");
}
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 2000, // Limit each IP to 2000 requests per `window` (here, per 5 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: response(true, "Too many requests, please try again later.", null),
    onLimitReached: function(req){
        const clientIp = requestIp.getClientIp(req); 
        blocked_ip.push(clientIp);
        addToBlackList(clientIp);
    }
})



const ip_blocker=ipfilter.IpFilter;

db.connect();
// db.query(getBlackList)
// .then(result=>{
//     if(result.rows.length){
//         for(let i=0; i<result.rows.length; i++){
//             blocked_ip.push(result.rows[i].ip_addr);
//             console.log(result.rows[i].ip_addr);
//         }
        
//     }
    
// })
// .catch(error=>{
//     console.error(error+"");
// })
app.use(ip_blocker(blocked_ip))
app.use(cors())
app.use('/public', express.static('public'))
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use('/api', router);




const addToBlackList=(ip_addr)=>{
    db.query(addBlackList,[ip_addr])
    .then(result=>{
        if(result.rows.length){

        } else {
            console.log("Error");
        }
    })
    .catch(err=>{
        console.error(err+"");
    })
}

function logger(req, res, next) {
    const clientIp = requestIp.getClientIp(req); 
    console.log(req.originalUrl+" from "+clientIp);

    const bearerHeader = req.headers['authorization'];
    let auth = '';
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        jwt.verify(req.token, secret_key, (err, authData) => {
            if (err) {
                writeLog(`{\n  Original URL: ${req.originalUrl},\n  Headers: ${req.headers['authorization']},\n  Params: ${JSON.stringify(req.params)},\n  Query: ${JSON.stringify(req.query)},\n  Files: ${JSON.stringify(req.files)},\n  Body: ${JSON.stringify(req.body)},\n  Date: ${new Date()},\n  AuthData: not found,\n IP: ${clientIp}\n},\n\n`);
            } else {
                writeLog(`{\n  Original URL: ${req.originalUrl},\n  Headers: ${req.headers['authorization']},\n  Params: ${JSON.stringify(req.params)},\n  Query: ${JSON.stringify(req.query)},\n  Files: ${JSON.stringify(req.files)},\n  Body: ${JSON.stringify(req.body)},\n  Date: ${new Date()},\n  AuthData: ${JSON.stringify(authData)},\n IP: ${clientIp}\n},\n\n`);
            }
        })
    } else {
        writeLog(`{\n  Original URL: ${req.originalUrl},\n  Headers: ${req.headers['authorization']},\n  Params: ${JSON.stringify(req.params)},\n  Query: ${JSON.stringify(req.query)},\n  Files: ${JSON.stringify(req.files)},\n  Body: ${JSON.stringify(req.body)},\n  Date: ${new Date()},\n  AuthData: not found,\n IP: ${clientIp}\n},\n\n`);
    }

    next();
}

const writeLog = (logs) => {
    fs.appendFile('modules/logger/logs.txt', logs, function (err) { if (err) console.log(err + ""); });
}

app.get('/socket-test', function(req, res,next) {  
    const html=fs.readFileSync('public/index.html', 'utf8');
    res.send(html);
});

const server=app.listen(5010, () => {
    console.log(`listening on port 5010`)
})

const io = new Server(server, { /* options */ });

io.on("connection", (client) => {
    console.log("Connected  "+client.id);
    client.on('onMessage', (data)=> {
        console.log(data)
        io.emit('onMessage', data);
    });
});

app.get('/get-logs',verifyToken,(req, res)=>{
    const logs=fs.readFileSync('modules/logger/logs.txt', 'utf8');
    res.json(JSON.stringify(logs));
})



export const socket_io = io;


