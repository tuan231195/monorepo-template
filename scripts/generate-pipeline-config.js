/* eslint-disable no-template-curly-in-string, import/no-extraneous-dependencies, sonarjs/no-duplicate-string */
const { exec } = require('shelljs');
const fs = require('fs');
const { CJob, CPipeline, CWorkflow, toYaml } = require('@vdtn359/circleci-pipeline-builder');

const actionType = process.argv[2];
const baseCommit = process.argv[3] ?? 'HEAD^1';
const releaseBranch = '/release\\/.*/';

const getAffectedPackages = (command = 'default', base = baseCommit, args = '') => {
	const { packages } = JSON.parse(
		exec(`npx turbo run ${command} --filter '...[${base}]' ${args} --dry-run=json`, { silent: true }).stdout
	);
	return packages.filter((p) => p !== '//');
};

const pipeline = new CPipeline();
pipeline.addOrb('trigger_pipeline', 'trustedshops-public/trigger-pipeline@1.1.0');
pipeline.prop('parameters', {
	action_type: {
		type: 'string',
		default: 'default',
	},
});

const npmSetup = `
    printf "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" >> ~/.npmrc
    npm config set access public
    git config --global user.email vdtn359@gmail.com
    git config --global user.name "System User"
    git branch --set-upstream-to origin/"\${CIRCLE_BRANCH}"
`.trim();

function extractJobName(deployPackage) {
	return (deployPackage.split('/')[1] ?? deployPackage).replace(/-/g, '_');
}

function branchFilter(branch) {
	return {
		filters: {
			branches: {
				only: branch,
			},
		},
	};
}

function buildNpmPlanReleaseJob() {
	const planReleaseJob = new CJob(`npm_plan_release`);
	planReleaseJob
		.prop('working_directory', '~/app')
		.prop('docker', [
			{
				image: 'vdtn359/node-pnpm-base:16-alpine-7.9.0',
			},
		])
		.addSinglelineStep('checkout')
		.addMultilineStep('restore_cache', {
			key: 'dependency-cache-{{ checksum "pnpm-lock.yaml" }}',
		})
		.addMultilineStep('run', {
			name: 'Install',
			command: 'pnpm i --frozen-lockfile',
		})
		.addMultilineStep('run', {
			name: 'Setup',
			command: npmSetup,
		})
		.addMultilineStep('run', {
			name: 'Plan Release',
			command: `npm run plan-release -- --filter ...[${baseCommit}]`,
		});
	pipeline.addJob(planReleaseJob);

	return planReleaseJob;
}

function buildNpmReleaseJob() {
	const releaseJob = new CJob(`npm_release`);
	releaseJob
		.prop('working_directory', '~/app')
		.prop('docker', [
			{
				image: 'vdtn359/node-pnpm-base:16-alpine-7.9.0',
			},
		])
		.addSinglelineStep('checkout')
		.addMultilineStep('add_ssh_keys', {
			fingerprints: ['${SSH_KEY_FINGERPRINT}'],
		})
		.addMultilineStep('restore_cache', {
			key: 'dependency-cache-{{ checksum "pnpm-lock.yaml" }}',
		})
		.addMultilineStep('run', {
			name: 'Install',
			command: 'pnpm i --frozen-lockfile',
		})
		.addMultilineStep('run', {
			name: 'Setup',
			command: npmSetup,
		})
		.addMultilineStep('run', {
			name: 'Release',
			command: `npm run release -- --filter ...[${baseCommit}]`,
		});
	pipeline.addJob(releaseJob);

	return releaseJob;
}

function buildPackageJob() {
	const affectedPackage = '<< parameters.package_name >>';

	const packageJob = new CJob(`package`);
	packageJob
		.prop('working_directory', '~/app')
		.prop('parameters', {
			package_name: {
				type: 'string',
			},
		})
		.prop('docker', [
			{
				image: 'vdtn359/node-pnpm-docker-base:16-alpine-7.9.0',
			},
		])
		.addSinglelineStep('checkout')
		.addMultilineStep('restore_cache', {
			key: 'dependency-cache-{{ checksum "pnpm-lock.yaml" }}',
		})
		.addMultilineStep('run', {
			name: 'Install',
			command: 'pnpm i --frozen-lockfile',
		})
		.addMultilineStep('setup_remote_docker', {
			version: '20.10.14',
		})
		.addMultilineStep('run', {
			name: 'Build',
			command: `npm run package -- --filter ${affectedPackage}`,
		});
	pipeline.addJob(packageJob);

	return packageJob;
}

function buildDefaultJob() {
	const affectedPackage = '<< parameters.package_name >>';
	const buildAndTestsJob = new CJob(`build_and_tests`);
	buildAndTestsJob
		.prop('working_directory', '~/app')
		.prop('parameters', {
			package_name: {
				type: 'string',
			},
		})
		.prop('docker', [
			{
				image: 'vdtn359/node-pnpm-base:16-alpine-7.9.0',
			},
		])
		.addSinglelineStep('checkout')
		.addMultilineStep('restore_cache', {
			key: 'dependency-cache-{{ checksum "pnpm-lock.yaml" }}',
		})
		.addMultilineStep('run', {
			name: 'Install',
			command: 'pnpm i --frozen-lockfile',
		})
		.addMultilineStep('run', {
			name: 'Build',
			command: `npm run build -- --filter ${affectedPackage}`,
		})
		.addMultilineStep('run', {
			name: 'Type check',
			command: `npm run tsc -- --filter ${affectedPackage}`,
		})
		.addMultilineStep('run', {
			name: 'Lint',
			command: `npm run lint -- --filter ${affectedPackage}`,
		})
		.addMultilineStep('run', {
			name: 'Test',
			command: `npm run test -- --filter ${affectedPackage}`,
		});
	pipeline.addJob(buildAndTestsJob);

	return buildAndTestsJob;
}

function addContinueToRelease(workflow, otherJobs) {
	workflow.addMultilineJob('trigger_pipeline/trigger', {
		...branchFilter(releaseBranch),
		branch: '${CIRCLE_BRANCH}',
		requires: otherJobs,
		'build-parameters': `'action_type=release'`,
		'circleci-token': 'CIRCLECI_API_KEY',
		context: ['CIRCLECI'],
		name: 'trigger_deployment',
		slug: '${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}',
	});
}

function buildDefaultWorkflow() {
	const defaultPackages = getAffectedPackages('default', baseCommit);
	const defaultWorkflow = new CWorkflow('build_and_tests');
	const allJobs = [];
	if (defaultPackages.length) {
		const buildAndTestsJob = buildDefaultJob();

		defaultPackages.forEach((defaultPackage) => {
			const jobName = extractJobName(defaultPackage);
			defaultWorkflow.addMultilineJob(buildAndTestsJob.name, {
				name: `build_${jobName}`,
				package_name: defaultPackage,
			});
			allJobs.push(`build_${jobName}`);
		});
	}
	addContinueToRelease(defaultWorkflow, allJobs);

	pipeline.addWorkflow(defaultWorkflow);
}

function buildReleaseWorkflow() {
	const releaseWorkflow = new CWorkflow('release');
	const deployPackages = getAffectedPackages('package', baseCommit, `--filter '!./packages/*'`);
	const npmReleaseJob = buildNpmReleaseJob();
	const npmPlanReleaseJob = buildNpmPlanReleaseJob();
	releaseWorkflow.addMultilineJob(npmPlanReleaseJob.name, {
		...branchFilter(releaseBranch),
		context: ['NPM'],
	});
	releaseWorkflow.addMultilineJob('hold_npm_release', {
		type: 'approval',
		requires: [npmPlanReleaseJob.name],
	});
	releaseWorkflow.addMultilineJob(npmReleaseJob.name, {
		...branchFilter(releaseBranch),
		requires: ['hold_npm_release'],
		context: ['NPM'],
	});
	if (deployPackages.length) {
		const buildAndTestsJob = buildPackageJob();

		deployPackages.forEach((deployPackage) => {
			const jobName = extractJobName(deployPackage);
			releaseWorkflow.addMultilineJob(buildAndTestsJob.name, {
				...branchFilter(releaseBranch),
				requires: ['npm_release'],
				name: `package_${jobName}`,
				package_name: deployPackage,
			});
		});
	}

	pipeline.addWorkflow(releaseWorkflow);
}

if (!actionType || actionType === 'default') {
	buildDefaultWorkflow();
} else if (actionType === 'release') {
	buildReleaseWorkflow();
}

const generatedCommand = toYaml(pipeline).replace(/"'(.*?)'"/g, "'$1'");
fs.writeFileSync('.circleci/generated-config.yml', generatedCommand, {
	encoding: 'utf-8',
});
