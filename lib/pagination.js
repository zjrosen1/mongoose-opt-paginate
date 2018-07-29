'use strict';

var hapiPaginate = require('./hapiPaginate');
var Boom = require('boom');


module.exports = function (Model, conf) {
	if (!conf) {
		conf = {
			defaultPageSize: 10,
			maxPageSize: 50
		};
	} else {
		conf.defaultPageSize = conf.defaultPageSize ? conf.defaultPageSize : 10;
		conf.maxPageSize = conf.maxPageSize ? conf.maxPageSize : 50;
	}

	async function paginate(req, search, options) {
		hapiPaginate.setQueryParams(req, conf.defaultPageSize, conf.maxPageSize);

		options = options || {};

		if (req.query.sortBy) {
			options.sortBy = {};

			var splitFields = req.query.sortBy.split(',');

			var ascendingSortDirection = '1';
			var directions = req.query.sortDirection || ascendingSortDirection;
			var splitDirections = directions.split(',');

			for (var i = 0; splitFields[i]; i++) {
				splitFields[i] = splitFields[i].trim();
				options.sortBy[splitFields[i]] = splitDirections[i] || 1;
			}
		}

		if (req.query.before) {
			options.before = req.query.before;
		}

		if (req.query.after) {
			options.after = req.query.after;
		}

		if (req.query.last) {
			options.last = req.query.last;
		}

		if (!search) {
			search = {};
		}

		return searchModelAndPaginate(search, options, req);
	}

	function searchModelAndPaginate(search, options, req) {
		return new Promise((resolve, reject) => {
			Model.paginate(
				search,
				req.query.currentPage,
				req.query.page,
				req.query.pageSize,
				function (err, newCurrentPage, before, after, pageCount, numPages, total, items) {
					if (err) {
						return reject(Boom.badData(err));
					}

					return resolve(formatResponse(req, newCurrentPage, before, after, pageCount, numPages, total, items));
				},
				options
			);
		});
	}

	function formatResponse(req, currentPage, before, after, pageCount, numPages, total, items) {
		if (before) {
			req.query.before = before;
		}

		if (after) {
			req.query.after = after;
		}

		req.query.currentPage = currentPage;

		var response = {
			page: currentPage,
			hasMore: hapiPaginate.hasNextPages(req)(numPages),
			links: {
				first: hapiPaginate.firstPage(req),
				prev: hapiPaginate.prevPage(req, numPages),
				next: hapiPaginate.nextPage(req, numPages),
				last: hapiPaginate.lastPage(req, numPages)
			},
			pageCount: pageCount,
			total: total,
			before: before,
			after: after,
			data: items
		};

		return response;
	}

	return paginate;
};
