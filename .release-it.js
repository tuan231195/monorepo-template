/* eslint-disable */
const merge = require('lodash.merge');

module.exports = (dirname, overrides = {}) => {
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
				commitMessage: `chore(repo): release ${name} \${version}`,
				tagName: `${name}@\${version}`,
				addUntrackedFiles: true,
			},
			npm: {
				publish: true,
			},
			github: {
				release: true,
				releaseName: `Release: ${name} \${version}`,
			},
			hooks: {
				"after:bump": "cd ../.. && git add . --all",
			}
		},
		overrides,
	);
};
