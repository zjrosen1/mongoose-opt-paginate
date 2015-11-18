var Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);

module.exports = {
	page: Joi.number().min(1).default(1),
	currentPage: Joi.number().min(1).default(Joi.ref('page')),
	pageSize: Joi.number().min(1),
	before: Joi.objectId(),
	after: Joi.objectId(),
	// list of properties in order of priority and spliced by comma
	sortBy: Joi.string().trim().default('_id'),
	// list of properties direction using 1 (ASC) -1 (DESC) spliced by comma
	sortDirection: Joi.any().valid('1', '-1').default('1')
};
