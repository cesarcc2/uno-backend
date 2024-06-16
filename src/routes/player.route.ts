import express from 'express';
import { playerController } from '../controllers/player.controller';
const router = express.Router();

router.get('/:id' , playerController.get);
router.post('/create' , playerController.create);
router.post('/recreate' , playerController.recreate);
router.put('/' , playerController.update);


export const playerRoutes = router;