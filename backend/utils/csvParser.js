const csv = require('csv-parser');
const { Readable } = require('stream');

/**
 * Parses CSV data from a buffer or string.
 * @param {Buffer|string} data The CSV data to parse
 * @param {Function} rowHandler A function called for each row. Can return mapped data, or undefined to skip.
 * @returns {Promise<Array>} A promise that resolves to an array of mapped row results.
 */
const parseCsvData = (data, rowHandler) => {
    return new Promise((resolve, reject) => {
        const results = [];
        Readable.from(data)
            .pipe(csv())
            .on('data', (row) => {
                const result = rowHandler(row);
                if (result !== undefined) {
                    results.push(result);
                }
            })
            .on('end', () => resolve(results))
            .on('error', reject);
    });
};

module.exports = {
    parseCsvData
};
