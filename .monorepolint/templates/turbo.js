const path = require('path');
const fs = require('fs');

const sourceFiles = ['src/**', 'package.json'];
const sourceFilesWithTests = sourceFiles.concat(['tests/**']);

const noTestFiles = [':!src/*.test.ts', ':!src/*.test.tsx', ':!src/*.spec.ts', ':!src/*.spec.tsx'];
const tsConfig = ['tsconfig.json', 'tsconfig.json', '../../tsconfig.json', '../../.swcrc'];
const testConfig = ['jest.config.js'];
const lintConfig = ['.eslintrc.js', '.eslintignore', '../../.eslintrc.js', '../../.prettierrc'];
const packageConfig = ['Dockerfile', '../../.dockerignore'];

const ciDependencies = ['../../docker-compose.yml'];
const sourceDependencies = sourceFiles.concat(tsConfig);
const sourceOnlyDependencies = sourceDependencies.concat(noTestFiles);
const testDependencies = sourceFilesWithTests.concat(testConfig);
const lintDependencies = sourceFilesWithTests.concat(lintConfig);
const packageDependencies = sourceOnlyDependencies.concat(packageConfig);
const defaultDependencies = Array.from(
	new Set(['**/*', ...tsConfig, ...testConfig, ...lintConfig, ...packageConfig, ...ciDependencies])
);

const baseObject = {
	$schema: 'https://turborepo.org/schema.json',
	globalDependencies: [],
	pipeline: {
		build: {
			inputs: sourceOnlyDependencies,
			dependsOn: ['^build'],
			outputs: ['dist/**'],
		},
		default: {
			inputs: defaultDependencies,
			outputs: [],
		},
		tsc: {
			inputs: sourceDependencies,
			outputs: [],
		},
		test: {
			dependsOn: ['build'],
			outputs: [],
			inputs: testDependencies,
		},
		clean: {
			outputs: [],
		},
		lint: {
			inputs: lintDependencies,
			outputs: [],
		},
		watch: {
			cache: false,
			outputs: [],
		},
		start: {
			cache: false,
			dependsOn: ['build'],
			outputs: [],
		},
		package: {
			dependsOn: ['build'],
			inputs: packageDependencies,
		},
		patch: {
			cache: false,
			dependsOn: ['build'],
		},
		release: {
			inputs: sourceOnlyDependencies,
			cache: false,
			dependsOn: ['build'],
		},
		'plan-release': {
			inputs: sourceOnlyDependencies,
			cache: false,
			dependsOn: ['build'],
		},
	},
};

fs.writeFileSync(path.resolve(__dirname, '..', '..', 'turbo.json'), JSON.stringify(baseObject, undefined, 4), {
	encoding: 'utf8',
});
