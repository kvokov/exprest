import { Router } from 'express';
import bodyParser from 'body-parser';


const DEFAULT_ITEMS_PER_PAGE = 50;
let config = {
    pagination: {
        itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
    },
    resources: false
};
let router;


function init(options = {}) {
    Object.assign(config, options);

    router = new Router();
    router.use(bodyParser.json());
    //router.createResource = createResource;

    if(Array.isArray(config.resources)) {
        config.resources = config.resources.map(normalizeResource);
        config.resources.forEach(createApi);
    }

    return router;
}


function normalizeResource(resourceConfig) {
    let resource = (typeof resourceConfig !== 'object') ? {model: resourceConfig} : resourceConfig;

    resource.collectionName = resource.collectionName || resource.model.name.toLowerCase() + 's';
    resource.itemName       = resource.itemName || resource.model.name.toLowerCase();
    resource.identifier     = resource.identifier || resource.model.forge().idAttribute;

    let hooksArray = {
        getItem         : [],
        getCollection   : [],
        createItem      : [],
        updateItem      : [],
        deleteItem      : []
    };
    resource.hooks = {
        before: {...hooksArray},
        after: {...hooksArray}
    };

    return resource;
}


function createApi(resource) {
    createEndpoints(resource);
    createHookSetters(resource);

    return router;
}


function createEndpoints(resource) {
    router.route('/' + resource.collectionName)
        .get(createCollectionEndpoint(resource));

    /*
     router.route('/' + resource.endpoint + '/:id')
     .get(createItemEndpoint(resource));
     */
}


function createHookSetters(resource) {
    router['beforeGet' + capitalize(resource.collectionName)] = createHook(resource, 'before', 'getCollection');
    router['beforeGet' + capitalize(resource.itemName)] = createHook(resource, 'before', 'getItem');
    router['beforeCreate' + capitalize(resource.itemName)] = createHook(resource, 'before', 'createItem');
    router['beforeUpdate' + capitalize(resource.itemName)] = createHook(resource, 'before', 'updateItem');
    router['beforeDelete' + capitalize(resource.itemName)] = createHook(resource, 'before', 'deleteItem');

    router['afterGet' + capitalize(resource.collectionName)] = createHook(resource, 'after', 'getCollection');
    router['afterGet' + capitalize(resource.itemName)] = createHook(resource, 'after', 'getItem');
    router['afterCreate' + capitalize(resource.itemName)] = createHook(resource, 'after', 'createItem');
    router['afterUpdate' + capitalize(resource.itemName)] = createHook(resource, 'after', 'updateItem');
    router['afterDelete' + capitalize(resource.itemName)] = createHook(resource, 'after', 'deleteItem');
}

function createHook(resource, time, name) {
    return (fn) => {
        if(typeof fn !== 'function') {
            throw new Error('Hook should be a function.')
        }
        resource.hooks[time][name].push(fn);
    }
}


function execHooks(resource, time, name, args) {
    console.log('hooks ' + time + ' ' + name, resource.hooks[time][name]);
    //console.log(args);
}

//
// Endpoints creators --------------------------------------------------------------------------------------------------
//


function createCollectionEndpoint(resource) {
    return (req, res, next) => {

        execHooks(resource, 'before', 'getCollection', [req, res]);

        console.log('endpoint')
        let params = {...req.query};
        if(config.pagination) {
            params.page = params.page || 1;
            params.size = params.size || config.pagination.itemsPerPage || DEFAULT_ITEMS_PER_PAGE;
        }

        params.sort   = params.sort || resource.identifier;
        params.expand  = params.expand ? (req.query.expand).split(',') : [];

        let criteria = {};

        Promise.all([
                // get items count
                new resource.model()
                    .where(criteria)
                    .count(),
                // get items
                new resource.model()
                    .query((qb) => {
                        if(config.pagination) {
                            qb.where(criteria).offset((params.page - 1) * params.size).limit(params.size);
                        }
                    })
                    .orderBy(params.sort)
                    .fetchAll({withRelated: params.expand})
            ])
            .then((results) => {
                let totalItemsCount = results[0] || 0;
                let items = results[1];

                let headers = {
                    'x-total-count': totalItemsCount
                };
                if(config.pagination) {
                    headers['x-page']       = params.page;
                    headers['x-page-size']  = params.size;
                }

                execHooks(resource, 'after', 'getCollection', [req, res]);

                res.set(headers).send(items);
            })
            .catch(next);
    }
}

function createItemEndpoint(resource) {
    return (req, res, next) => {
        let criteria = {};
        criteria[resource.identifier] = req.params.id;

        new resource.model()
            .where(criteria)
            .fetch()
            .then((item) => {
                if(!item) {
                    return next(new Error('Not Found', 404));
                }
                res.json(item);
            })
            .catch(next);
    }
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


export default init;