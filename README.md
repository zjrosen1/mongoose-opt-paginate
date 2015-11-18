# Mongoose Optimized Paginate (MOP)
Optimized pagination using indexes (no cursor.skip) with fallback. Used with Mongoose + Hapi.js.
> Fork of [MOP](https://github.com/tesfaldet/mongoose-opt-paginate)

### Getting Started
```sh
$ npm install hapi-mongoose-opt-paginate
```

The MOP plugin returns an object containing a property for accessing the api (paginate function) and a property for accessing the mongoose plugin.

The first step is to include the plugin in your mongoose instance e.g.

```javascript
var mongoose = require('mongoose'),
	pagination = require('hapi-mongoose-opt-paginate');

mongoose.plugin(pagination.plugin);
```

Now you can start paginating!

### Examples _(found it at examples/server.js)_
```javascript
var mongoose = require('mongoose');
var Hapi = require('hapi');
var Pagination = require('hapi-mongoose-opt-paginate');

// Create Hapi.js server
var server = new Hapi.Server();

var mongodb_uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hapi_mongoose_pagination'

// Connect to mongodb
mongoose.connect(mongodb_uri);

// When successfully connected
mongoose.connection.on('connected', function () {
	console.log('Mongoose default connection open to ' + mongodb_uri);
	mongoose.connection.db.dropCollection('tests', function(err, result) {
		console.log('database collection cleaned.');
	});
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
	console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function () {
	console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function () {
	mongoose.connection.close(function () {
		console.log('Mongoose default connection disconnected through app termination');
		process.exit(0);
	});
});

// ** required **
mongoose.plugin(Pagination.plugin);

var TestSchema = mongoose.Schema({
	name: {
		type: String,
		trim: true,
		required: true
	}
});

var Test = mongoose.model('Test', TestSchema);

for (var i = 0; i < 100; i++) {
	Test.create({name: 'test_' + i});
}

// returns a function(req, reply, search, options, cb)
paginate_test = Pagination.api(Test);

server.connection({
	port: 8080
});

server.route({
	method: 'GET',
	path: '/autoReply',
	config: {
		validate: {
			query: Pagination.querySchema
		}
	},
	handler: function (request, reply) {
		// no callback will assume end of route (reply called with results)
		paginate_test(request, reply);
	}
});

server.route({
	method: 'GET',
	path: '/cbReply',
	config: {
		validate: {
			query: Pagination.querySchema
		}
	},
	handler: function (request, reply) {
		// with callback
		paginate_test(request, reply, {}, {}, function (results) {
			/* results
			 {
			 "page": 1,
			 "hasMore": true,
			 "links": {
			 "first": "/cbReply?page=1&currentPage=1&pageSize=10",
			 "next": "/cbReply?page=2&currentPage=1&pageSize=10&after=<objectid>",
			 "last": "/cbReply?page=2&currentPage=1&pageSize=10&last=true"
			 },
			 "pageCount": 10,
			 "total": 14,
			 "before": "<objectid>",
			 "after": "<objectid>",
			 "data": [{<tests>}]
			 }
			 */

			// do something with results
			reply(results);
		});
	}
});

server.start(function () {
	console.log('Server running at:', server.info.port);
});
```
#### Things to Note

If sorting, make sure a compound index (collection-level) exists for the sort field(s) and _id field in proper order

e.g. So if you're sorting by name, date, and _id (_id is always there by default and follows the same order as the first/primary sort key: name, in this case) and you want optimized pagination, the compound indexes {name: 1, date: 1, _id: 1} (for optimization when primary sort key in ascending) and {name: -1, date: 1, _id: -1} (for optimization when primary sort key in descending) should exist on the collection-level (not schema-level). Opposite compound indexes don't need to be created i.e. {name: -1, date: -1, _id: -1} and {name: 1, date: -1, _id: 1} wouldn't need to be added if the above indexes already exist.

If sorting (with more than by _id since it's always included) and a matching compound index is not found, pagination will fall back to a non-optimized state. If it's just by _id, no worries, there's a default index for _id that always exists.

### Todo's
- Write unit and integration tests (Current test be part of forked repo.)
- Complete Documentation (ASAP)

### Release History

#### 0.1.2
* Example and Readme update on sample of results object.

#### 0.1.1
* Package tags update to include hapi.js

#### 0.1.0
* Full integration with hapi.js request/reply style.
* Created [example](examples/server.js)
* TODO: Update unit test.

### License
MIT
