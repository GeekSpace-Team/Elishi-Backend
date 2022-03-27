import express from 'express';
import { publicRouter } from './public/public.mjs';
import { userRouter } from './user/user.mjs';

const router = express.Router();
router.use('/user',userRouter);
router.use('/public',publicRouter);

export const mobileRouter = router;