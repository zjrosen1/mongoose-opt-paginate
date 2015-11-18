/**
 * Created by jorgecuesta on 17/11/15.
 */
var mongoose = require('mongoose');
var Hapi = require('hapi');
var Pagination = require('./../index');

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
			 "first": "/courses?page=1&currentPage=1&pageSize=10",
			 "next": "/courses?page=2&currentPage=1&pageSize=10&after=<encoded>",
			 "last": "/courses?page=2&currentPage=1&pageSize=10&last=true"
			 },
			 "pageCount": 10,
			 "total": 14,
			 "before": "<encoded>",
			 "after": "<encoded>",
			 "data": [{<courses>}]
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
