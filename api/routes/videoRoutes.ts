import { Router } from 'express';
import { videoController } from '../controllers/videoController.js';

const router = Router();

router.post('/parse', videoController.parse);
router.get('/download', videoController.download);
// router.get('/download-audio', videoController.downloadAudio); // Combined into download with type param

export const videoRouter = router;
