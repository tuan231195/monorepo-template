const path = require('path');

module.exports = {
	extends: ['@vdtn359/eslint-config'],
	parserOptions: {
		project: path.resolve(__dirname, 'tsconfig.json'),
	},
	ignorePatterns: ['!.*', 'dist', 'node_modules'],
};
