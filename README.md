# ExpREST

ExpREST helps you build RESTful API with [Express](http://expressjs.com/) and [Bookshelf.js](http://bookshelfjs.org/). Easily create a flexible REST interface for your models, and extend these with your application specific logic.

Try on example - [exprest-example](https://github.com/kvokov/exprest-example)

## Installation
```bash
$ npm install exp-rest --save
```

## Quick Start

Lets say you have a Bookshelf model called `User`

```javascript
let User = bookshelf.Model.extend({
    tableName: 'users'
});
```

To create CRUD endpoints for your models you just need to pass resources array to ExpREST

```javascript
let app = require('express')();
let exprest = require('exp-rest');

app.use(exprest({resources: [User]}));

app.listen(3000);
```

And you gets these endpoints

| Method | URL          | Action                  |
| :----- | :------------| :-----------------------|
| GET    | `/users`     | Get list of users       |
| GET    | `/users/:id` | Get a user by id        |
| POST   | `/users`     | Create a new user       |
| PUT    | `/users/:id` | Update an existing user |
| DELETE | `/users/:id` | Delete an existing user |

**That's it!** :sunglasses:

## Documentation

- [Configuration](#configuration)
- [Endpoints](#endpoints)
- [Hooks](#hooks)
- [Examples](#examples)

### Configuration

### Endpoints

#### Get list of entities

> GET `/entities`

Listing resources support filtering, searching, sorting, and pagination.

#### Get an entity by identifier

> GET `/entities/:identifier`

#### Create a new entity

> POST `/entities`

#### Update an existing entity

> PUT `/entities/:identifier`

#### Delete an existing entity

> DELETE `/entities/:identifier`

### Hooks

Hooks let you extend and override default endpoint behaviors.

`before` hooks are executed before the default database action, such as fetch, save, or delete. 

`after` hooks are executed after all database actions are complete.

Hook names are generated based on endpoint configurations. This list is based on a `/users` endpoint where `itemName = user` and `collectionName = users`

| Hook Name                 | Request                   | Arguments                             |
| :-------------------------| :------------------------ | :------------------------------------ |
| `beforeGetUsers`          | GET `/users`              | [req, res, userModel]                 |
| `afterGetUsers`           | GET `/users`              | [req, res, userCollection]            |
| `beforeGetUser`           | GET `/users/:id`          | [req, res, userModel]                 |
| `afterGetUser`            | GET `/users/:id`          | [req, res, userModel]                 |
| `beforeCreateUser`        | POST `/users`             | [req, res, userModel]                 |
| `afterCreateUser`         | POST `/users`             | [req, res, userModel]                 |
| `beforeUpdateUser`        | PUT `/users/:id`          | [req, res, userModel]                 |
| `afterUpdateUser`         | PUT `/users/:id`          | [req, res, userModel]                 |
| `beforeDeleteUser`        | DELETE `/users/:id`       | [req, res, userModel]                 |
| `afterDeleteUser`         | DELETE `/users/:id`       | [req, res, userModel]                 |
| `beforeGetRelatedThings`  | GET `/users/:id/things`   | [req, res, thingModel]                |
| `afterGetRelatedThings`   | GET `/users/:id/things`   | [req, res, thingsCollection]          |
| `beforeRelatedThing`      | POST `/users/:id/things`  | [req, res, userModel]                 |
| `afterRelateThing`        | POST `/users/:id/things`  | [req, res, userModel, thingModel]     |

`req` and `res` are an Express [request](http://expressjs.com/4x/api.html#request) and [response](http://expressjs.com/4x/api.html#response)

`userModel` is an instance of a [bookshelf model](http://bookshelfjs.org/#Model)

`userCollection` is an instance of a [bookshelf collection](http://bookshelfjs.org/#Collection)

#### Adding hooks

#### How to use hooks

## License

[MIT](LICENSE)