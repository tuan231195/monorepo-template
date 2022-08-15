const path = require('path');

module.exports = {
	extends: ['@vdtn359/eslint-config'],
	parserOptions: {
		project: path.resolve(__dirname, 'tsconfig.eslint.json'),
	},
	settings: {
		'import/resolver': {
			typescript: {
				project: path.resolve(__dirname, 'tsconfig.eslint.json'),
			},
		},
	},
};
