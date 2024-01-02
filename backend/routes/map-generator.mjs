import express from 'express';
import {generateMap} from "softwar-shared/services/map-service.mjs";
const router = express.Router();


router.get('/:type/:dimensions', async function(req, res, next) {
    if(!req.params.type || !req.params.dimensions) {
        res.status("412");
        return;
    }
    const dimensions = req.params.dimensions.split('x');
    const result = generateMap(req.params.type, dimensions[0], dimensions[1])
    if(!result) {
        res.status("412");
        return;
    }
    res.send(result).status(200);
});

export default router;