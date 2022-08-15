const path = require('path');
const fs = require('fs');
const packageJson = require('../../package.json');

const getDependenciesMatching = (globs) =>
	Object.keys(packageJson.devDependencies || {})
		.filter((name) => globs.some((glob) => name.includes(glob)))
		.map((name) => `../../node_modules/${name}/package.json`);

const sourceFiles = ['src/**', 'tsconfig.json', 'package.json'];

const sourceFilesWithTests = sourceFiles.concat(['tests/**']);

const sourceDependencies = sourceFiles.concat([
	'../../tsconfig.base.json',
	...getDependenciesMatching(['tsc', 'typescript', 'swc']),
]);

const testDependencies = sourceFilesWithTests.concat([...getDependenciesMatching(['jest'])]);

const lintDependencies = sourceFilesWithTests.concat([...getDependenciesMatching(['prettier', 'lint'])]);

const packageDependencies = sourceDependencies.concat(['Dockerfile', '../../.dockerignore']);

const baseObject = {
	$schema: 'https://turborepo.org/schema.json',
	globalDependencies: [],
	pipeline: {
		build: {
			inputs: sourceDependencies,
			dependsOn: ['^build'],
			outputs: ['dist/**'],
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
			inputs: sourceDependencies,
			cache: false,
			dependsOn: ['build'],
		},
		'plan-release': {
			inputs: sourceDependencies,
			cache: false,
			dependsOn: ['build'],
		},
	},
};

fs.writeFileSync(path.resolve(__dirname, '..', '..', 'turbo.json'), JSON.stringify(baseObject, undefined, 4), {
	encoding: 'utf8',
});
