/* eslint-disable */
const packageJson = require('./package.json');

const name = packageJson.name.split('/')[1];

module.exports = {
	"plugins": {
	  "@release-it/conventional-changelog": {
		"preset": {
		  "name": "conventionalcommits",
		  "types": [
			{
			  "type": "feat",
			  "section": "Features"
			},
			{
			  "type": "fix",
			  "section": "Bug Fixes"
			},
			{
			  "type": "cleanup",
			  "section": "Cleanup"
			},
			{
			  "type": "docs",
			  "section": "Documentations"
			}
		  ]
		},
		"infile": "./CHANGELOG.md"
	  },
	  "@release-it/bumper": {
		"in": "./package.json",
		"out": ["./version.json"]
	  }
	},
	"git": {
	  "commitMessage": `chore(repo): release ${name} \${version}`,
	  "tagName": `${name}-v\${version}`
	},
	"npm": {
	  "publish": true
	},
	"github": {
	  "release": true,
	  "releaseName": `Release: ${name} \${version}`
	}
  }