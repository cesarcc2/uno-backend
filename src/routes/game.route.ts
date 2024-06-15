import express from 'express';
import { gameController } from '../controllers/game.controller';
const router = express.Router();

router.get('/' , gameController.get);
router.post('/create' , gameController.create);
router.post('/quick-join' , gameController.quickJoin);
router.post('/join', gameController.join);
router.post('/leave', gameController.leave);
router.post('/start' , gameController.start);

export const gameRoutes = router;