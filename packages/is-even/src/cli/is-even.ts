import { Command } from 'commander';
import { isEven } from '..';

const program = new Command();

program.option('-n, --number <number>', 'Input number');

program.parse(process.argv);

const options = program.opts();

// eslint-disable-next-line no-console
console.info('Is even?', isEven(Number(options.number)));
