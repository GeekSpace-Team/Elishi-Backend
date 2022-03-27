import express from 'express';
import { verifyToken } from '../../../modules/auth/token.mjs';
import { getUserCountWithoutCondition } from '../../../modules/constant/admin_query.mjs';
import { db } from '../../../modules/database/connection.mjs';
import { badRequest,response } from '../../../modules/response.mjs';
import { admin } from '../../fcm/fcm.mjs';

const router = express.Router();


router.post('/push-to-topic', verifyToken, (req, res) => {
    // Define a condition which will send to devices which are subscribed
    // to either the Google stock or the tech industry topics.
    if(typeof req.body.title === 'undefined' || typeof req.body.body === 'undefined'){
        badRequest(req,res);
        return;
    }
    db.query(getUserCountWithoutCondition)
    .then(result=>{
        let data = {};
        if(typeof req.body.data !== 'undefined' && req.body.data != null){
            data=req.body.data;
        }
        let condition = '\'topic\' in topics';
        if(result.rows.length){
            let userCount = result.rows[0].page_count;
            if(userCount > 0){
                let tp=0;
                for(let j=1;j<=userCount;j+=1000){
                    tp++;
                    condition+=' || \'topic'+tp+'\' in topics'
                }
                console.log(data);
            }
        }
        const message = {
            notification: {
                title: req.body.title,
                body: req.body.body
            },
            data: data,
            android: {
                priority: 'high'
            },
            condition: condition
        };
        // Send a message to devices subscribed to the provided topic.
        admin.messaging().send(message)
            .then((resp) => {
                // Response is a message ID string.
                console.log('Successfully sent message:', resp);
                res.json(response(false,"success",resp));
                res.end();
            })
            .catch((error) => {
                console.log('Error sending message:', error);
                badRequest(req,res);
            });
    }).catch(error=>{
        console.log('Error sending message:', error);
        badRequest(req,res);
    })
    
});

router.post('/push-to-token',verifyToken,(req,res) => {
    if(typeof req.body.title === 'undefined' || typeof req.body.body === 'undefined' || typeof req.body.token === 'undefined'){
        badRequest(req,res);
        return;
    }
    let data = {};
    if(typeof req.body.data !== 'undefined' && req.body.data != null){
        data=req.body.data;
    }
    
    const message = {
        notification: {
            title: req.body.title,
            body: req.body.body
        },
        token:req.body.token,
        data: data,
        android: {
            priority: 'high'
        }
        
    };
    // Send a message to devices subscribed to the provided topic.
    admin.messaging().send(message)
        .then((resp) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', resp);
            res.json(response(false,"success",resp));
            res.end();
        })
        .catch((error) => {
            console.log('Error sending message:', error);
            badRequest(req,res);
        });
})



export const sendNotificationToUser = (token,title,body,data) => {
    const message = {
        notification: {
            title: title,
            body: body
        },
        token:token,
        data: data,
        android: {
            priority: 'high'
        }
        
    };
    // Send a message to devices subscribed to the provided topic.
    admin.messaging().send(message)
        .then((resp) => {
            // Response is a message ID string.
            console.log('Successfully sent message:', resp);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
        });
}


export const pushRouter = router;