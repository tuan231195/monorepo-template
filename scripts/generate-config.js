const {exec} = require('shelljs');
const fs = require('fs');
const {CJob, CPipeline, CWorkflow, toYaml} = require('@vdtn359/circleci-pipeline-builder')

const getAffectedPackages = (base) => {
    const {packages} = JSON.parse(exec(`npx turbo run default --filter '...[${base}]' --dry-run=json`, {silent: true}).stdout);
    return packages.filter(p => p !== '//');
}

const affectedPackages = getAffectedPackages('HEAD~1');

const pipeline = new CPipeline();
const buildWorkflow = new CWorkflow('build_and_tests');

if (affectedPackages.length > 0) {
    for (const affectedPackage of affectedPackages) {
        const jobName = (affectedPackage.split('/')[1] ?? affectedPackages).replace(/-/g, '_');
        const buildAndTestsJob = new CJob(`build_${jobName}`);
        buildAndTestsJob
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
                description: 'Install',
                command: 'pnpm i --frozen-lockfile'
            })
            .addMultilineStep('run', {
                description: 'Build',
                command: `npm run build -- --filter ${affectedPackage}`
            })
            .addMultilineStep('run', {
                description: 'Lint',
                command: `npm run lint -- --filter ${affectedPackage}`
            })
            .addMultilineStep('run', {
                description: 'Test',
                command: `npm run test -- --filter ${affectedPackage}`
            });

        pipeline.addJob(buildAndTestsJob);
        buildWorkflow.addSingleLineJob(buildAndTestsJob.name)
    }
} else {
    const passJob = new CJob(`pass`);
    passJob.prop('docker', {
        image: 'cimg/base:stable'
    })
    passJob.addMultilineStep('run', {
        description: 'Pass',
        command: `echo 'pass'`
    });
    pipeline.addJob(passJob);
    buildWorkflow.addSingleLineJob(passJob.name)
}

pipeline
    .addWorkflow(buildWorkflow);

fs.writeFileSync('.circleci/generated-config.yml', toYaml(pipeline), {
    encoding: 'utf-8',
});
