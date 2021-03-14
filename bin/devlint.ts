#!/usr/bin/env node

import 'v8-compile-cache';
import chalk from 'chalk';
import { formatWithOptions } from 'util';
import { release as getOsInformations } from 'os';

import { cli } from '../src/cli';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../../package.json');

(async () => {
	process.on('uncaughtException',  onFatalError);
	process.on('unhandledRejection', onFatalError);
	await cli();
})().catch(onFatalError);

const faces = [ // {{{
	'(╬ಠ益ಠ)',
	'(;≧皿≦)',
	'(　ﾟДﾟ)＜!!',
	'щ(ºДºщ)',
	'(ﾟДﾟ；)ゞ',
	'(ﾉꐦ◎曲◎)ﾉ=͟͟͞͞ ⌨ ',
	'(ノಠ益ಠ)ノ彡┻━┻',
	'(ノ ﾟДﾟ)ノ　＝＝＝＝　┻━━┻',
	'(ノಠ ∩ಠ)ノ彡( o°o)',
	'!!!!|┛*｀Д´|┛・・~~┻━┻　┳━┳',
	'ε=ε=(っ*´□`)っ',
	'ε＝ε＝ε＝(((((ﾉ｀･Д･)ﾉ',
	'(ノ´ロ`)ノ',
	'ヾ( •́д•̀ ;)ﾉ',
	'ｍ（＿　＿；；ｍ',
	'_:(´□`」 ∠):_',
	'(ー△ー；)',
	'!(*´∀｀*)尸”',
	'(ﾉ´ｰ`)ﾉ',
	'ﾍ(;´Д｀ﾍ)',
	'(・_・)ゞ',
	'(;＾◇＾;)ゝ',
	'( ・◇・)？',
	'( ゜Д゜；)！？',
	'щ(▼ﾛ▼щ)',
	'( •᷄ὤ•᷅)？',
	'(⊙_☉)',
	'?(°Д°≡°Д°)?',
]; // }}}

function onFatalError(error: unknown) {
	console.error([
		'',
		faces[Math.floor(Math.random() * faces.length)],
		chalk.bold.yellow('An unexpected fatal error has occurred!'),
		'',
		'We’re very sorry about that. If you think this is a bug in DevLint, you can report it at:',
		'https://github.com/cheap-glitch/devlint/issues',
		'Please also include the informations below to help us fix the problem faster!',
		'',
		// TODO: copy infos to clipboard?
		(error instanceof Error)
			? colorErrorStack(error.stack ?? `${error.constructor.name}: ${error.message}`)
			: `Raw error data:\n${formatWithOptions({ colors: true }, '%o', error)}`,
		'',
		`System:          ${getOsInformations()}`,
		`Node version:    ${process.versions.node}`,
		`DevLint version: ${version}`,
		'',
	].join('\n'));

	process.exitCode = 2;
}

function colorErrorStack(stack: string): string {
	return stack.split('\n').map((line, index) => (index === 0) ? chalk.red(line) : / \/|\(\//.test(line) ? chalk.dim(line) : chalk.black(line)).join('\n');
}
