'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _express = require('express');

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEFAULT_ITEMS_PER_PAGE = 50;
var config = {
    pagination: {
        itemsPerPage: DEFAULT_ITEMS_PER_PAGE
    },
    resources: false
};
var router = void 0;

function init() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    Object.assign(config, options);

    router = new _express.Router();
    router.use(_bodyParser2.default.json());
    //router.createResource = createResource;

    if (Array.isArray(config.resources)) {
        config.resources = config.resources.map(normalizeResource);
        config.resources.forEach(createApi);
    }

    return router;
}

function normalizeResource(resourceConfig) {
    var resource = (typeof resourceConfig === 'undefined' ? 'undefined' : _typeof(resourceConfig)) !== 'object' ? { model: resourceConfig } : resourceConfig;

    resource.collectionName = resource.collectionName || resource.model.name.toLowerCase() + 's';
    resource.itemName = resource.itemName || resource.model.name.toLowerCase();
    resource.identifier = resource.identifier || resource.model.forge().idAttribute;

    var hooksArray = {
        getItem: [],
        getCollection: [],
        createItem: [],
        updateItem: [],
        deleteItem: []
    };
    resource.hooks = {
        before: _extends({}, hooksArray),
        after: _extends({}, hooksArray)
    };

    return resource;
}

function createApi(resource) {
    createEndpoints(resource);
    createHookSetters(resource);

    return router;
}

function createEndpoints(resource) {
    router.route('/' + resource.collectionName).get(createCollectionEndpoint(resource));

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
    return function (fn) {
        if (typeof fn !== 'function') {
            throw new Error('Hook should be a function.');
        }
        resource.hooks[time][name].push(fn);
    };
}

function execHooks(resource, time, name, args) {
    console.log('hooks ' + time + ' ' + name, resource.hooks[time][name]);
    //console.log(args);
}

//
// Endpoints creators --------------------------------------------------------------------------------------------------
//


function createCollectionEndpoint(resource) {
    return function (req, res, next) {

        execHooks(resource, 'before', 'getCollection', [req, res]);

        console.log('endpoint');
        var params = _extends({}, req.query);
        if (config.pagination) {
            params.page = params.page || 1;
            params.size = params.size || config.pagination.itemsPerPage || DEFAULT_ITEMS_PER_PAGE;
        }

        params.sort = params.sort || resource.identifier;
        params.expand = params.expand ? req.query.expand.split(',') : [];

        var criteria = {};

        Promise.all([
        // get items count
        new resource.model().where(criteria).count(),
        // get items
        new resource.model().query(function (qb) {
            if (config.pagination) {
                qb.where(criteria).offset((params.page - 1) * params.size).limit(params.size);
            }
        }).orderBy(params.sort).fetchAll({ withRelated: params.expand })]).then(function (results) {
            var totalItemsCount = results[0] || 0;
            var items = results[1];

            var headers = {
                'x-total-count': totalItemsCount
            };
            if (config.pagination) {
                headers['x-page'] = params.page;
                headers['x-page-size'] = params.size;
            }

            execHooks(resource, 'after', 'getCollection', [req, res]);

            res.set(headers).send(items);
        }).catch(next);
    };
}

function createItemEndpoint(resource) {
    return function (req, res, next) {
        var criteria = {};
        criteria[resource.identifier] = req.params.id;

        new resource.model().where(criteria).fetch().then(function (item) {
            if (!item) {
                return next(new Error('Not Found', 404));
            }
            res.json(item);
        }).catch(next);
    };
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

exports.default = init;