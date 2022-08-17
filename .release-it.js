// eslint-disable-next-line import/no-extraneous-dependencies
const merge = require('lodash.merge');

module.exports = (dirname, overrides = {}) => {
	// eslint-disable-next-line import/no-dynamic-require
	const packageJson = require(`${dirname}/package.json`);
	const name = packageJson.name.split('/')[1];

	return merge(
		{
			plugins: {
				'@release-it/conventional-changelog': {
					preset: {
						name: 'conventionalcommits',
						types: [
							{
								type: 'feat',
								section: 'Features',
							},
							{
								type: 'fix',
								section: 'Bug Fixes',
							},
							{
								type: 'cleanup',
								section: 'Cleanup',
							},
							{
								type: 'docs',
								section: 'Documentations',
							},
							{
								type: 'chore',
								section: 'Other changes',
							},
						],
					},
					infile: 'CHANGELOG.md',
					gitRawCommitsOpts: {
						path: dirname,
					},
					lernaPackage: name,
					path: dirname,
				},
				'@vdtn359/release-it-deps-plugin': {
					packageName: packageJson.name,
					workspacePath: __dirname,
				},
			},
			git: {
				commitMessage: `chore(repo): release ${name} \${version} [skip ci]`,
				tagName: `${name}@\${version}`,
				addUntrackedFiles: true,
			},
			npm: {
				publish: false,
			},
			github: {
				release: true,
				releaseName: `Release: ${name} \${version}`,
			},
			hooks: {
				'after:bump': 'cd ../.. && git add . --all && cd -',
				'after:release': 'npm run publish-package --if-present',
			},
		},
		overrides
	);
};
