/***
 * Parses pagination, sorting, and filtering parameters from the request query.
 * @param {Object} query - The request query object.
 * @param {string[]} allowedSortFields - whitelist of sortable fields.
 * @returns {{skip, limit, page, orderBy}}
 */
function parsePaginationParams(query, allowedSortFields = ['createdAt']) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
    const skip = (page - 1) * limit;

    const validOrders = ['asc', 'desc'];
    const sortField = allowedSortFields.includes(query.sortBy) ? query.sortBy : allowedSortFields[0];
    const  sortOrder = validOrders.includes(query.order) ? query.order : 'desc';

    const orderBy = { [sortField]: sortOrder };

    return { page, limit, skip, orderBy };
}

/**
 * Builds a standard pagination metadata object for API responses
 * @param {number} total - total matching records from DB
 * @param {number} page - current page number
 * @param {number} limit - number of records per page
 * @returns {object} pagination metadata
 */
function buildPaginationMetadata(total, page, limit) {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}

module.exports = {
    parsePaginationParams,
    buildPaginationMetadata,
};