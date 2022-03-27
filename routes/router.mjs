import express from 'express';
import { adminRouter } from './admin/admin_router.mjs';
import { mobileRouter } from './mobile/mobile_router.mjs';
import { userRouter } from './tempUser.mjs';

const router = express.Router();

router.use('/users',userRouter);
router.use('/admin',adminRouter);
router.use('/mobile',mobileRouter);

export {router}