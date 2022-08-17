/* eslint-disable import/no-extraneous-dependencies, @typescript-eslint/no-explicit-any,  sonarjs/no-duplicate-string, no-template-curly-in-string */
const { exec } = require('shelljs');

const getPackagesMatching = (glob: string) => {
	const packages = JSON.parse(exec(`pnpm ls --filter '${glob}' --json`, { silent: true }).stdout);
	return packages.map((p: any) => p.name);
};

module.exports = {
	rules: {
		':file-contents': [
			{
				options: {
					file: 'jest.config.js',
					templateFile: '.monorepolint/templates/jest.config.js',
				},
			},
			{
				options: {
					file: '.eslintignore',
					templateFile: '.monorepolint/templates/.eslintignore',
				},
			},
			{
				options: {
					file: '.eslintrc.js',
					templateFile: '.monorepolint/templates/.eslintrc.js',
				},
			},
			{
				options: {
					file: '.release-it.js',
					templateFile: '.monorepolint/templates/.release-it.apps.js',
				},
				includePackages: getPackagesMatching('./components/*'),
			},
			{
				options: {
					file: '.release-it.js',
					templateFile: '.monorepolint/templates/.release-it.packages.js',
				},
				includePackages: getPackagesMatching('./packages/*'),
			},
			{
				options: {
					file: 'Dockerfile',
					templateFile: '.monorepolint/templates/Dockerfile',
				},
			},
			{
				options: {
					file: 'tsconfig.json',
					templateFile: '.monorepolint/templates/tsconfig.json',
				},
			},
			{
				options: {
					file: '.node-dev.json',
					templateFile: '.monorepolint/templates/.node-dev.json',
				},
				includePackages: getPackagesMatching('./components/*'),
			},
		],
		':package-script': [
			{
				options: {
					scripts: {
						clean: 'rm -rf dist',
						default: 'echo default',
						lint: 'eslint . --max-warnings=0',
						build: 'swc --config-file ../../.swcrc ./src -d dist',
						test: 'jest --passWithNoTests',
						tsc: 'tsc',
						patch: 'release-it -i patch --ci -VV',
						release: 'release-it --ci -VV',
						'plan-release': 'release-it --ci --dry-run -VV',
					},
				},
			},
			{
				options: {
					scripts: {
						start: 'node-dev src/index.ts',
						'start:prod': 'node dist/index',
						package: 'npm run prepare-workspace && npm run docker',
						'prepare-workspace':
							'pnpm-isolate-workspace . --src-less-disable --src-less-prod-disable --workspaces-exclude-glob=src --src-files-exclude-glob=src --src-files-enable',
						docker: 'DOCKER_BUILDKIT=1 docker build -t ${npm_package_config_docker}:${npm_package_version} . && docker tag ${npm_package_config_docker}:${npm_package_version} ${npm_package_config_docker}:latest',
					},
				},
				includePackages: getPackagesMatching('./components/*'),
			},
			{
				options: {
					scripts: {
						watch: 'swc --config-file ../../.swcrc ./src -d dist -w',
						'publish-package': 'pnpm publish --no-git-checks',
					},
				},
				includePackages: getPackagesMatching('./packages/*'),
			},
		],
		':package-order': true,
		':alphabetical-dependencies': true,
	},
};
