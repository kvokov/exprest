import { Router } from 'express';
import bodyParser from 'body-parser';


let router;


function init(options = {}) {
    router = new Router();
    router.use(bodyParser.json());
    
    return router;
}


export default init;