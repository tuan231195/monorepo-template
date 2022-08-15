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
					ignoreRecommendedBump: process.env.IGNORE_RECOMMENDED_BUMP,
					gitRawCommitsOpts: {
						path: dirname,
					},
					lernaPackage: name,
					path: dirname,
					whatBump: (commits) => {
						if (!commits.length) {
							return {
								level: null,
							};
						}
						let level = 2;
						let breakings = 0;
						let features = 0;

						commits.forEach((commit) => {
							if (commit.notes.length > 0) {
								breakings += commit.notes.length;
								level = 0;
							} else if (commit.type === 'feat') {
								features += 1;
								if (level === 2) {
									level = 1;
								}
							}
						});

						return {
							level: level,
							reason:
								breakings === 1
									? `There is ${breakings} BREAKING CHANGE and ${features} features`
									: `There are ${breakings} BREAKING CHANGES and ${features} features`,
						};
					},
					infile: './CHANGELOG.md',
				},
				'@vdtn359/release-it-deps-plugin': {
					packageName: packageJson.name,
					workspacePath: __dirname,
				},
				'@release-it/bumper': {
					in: './package.json',
					out: ['./version.json'],
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
