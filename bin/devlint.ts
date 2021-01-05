#!/usr/bin/env node

import 'v8-compile-cache';

import { release } from 'os';
import { formatWithOptions } from 'util';

import { cli } from '../src/cli';

(async () => {
	process.on('uncaughtException',  onFatalError);
	process.on('unhandledRejection', onFatalError);

	await cli();
})().catch(onFatalError);

function onFatalError(error: unknown) {
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

	console.error([
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		`DevLint v${require('../package.json').version} (Node v${process.versions.node} on ${release()})`,
		'',
		faces[Math.floor(Math.random() * faces.length)],
		'An unexpected error has occurred!',
		'',
		(error instanceof Error) ? error.stack : `Raw error data:\n${formatWithOptions({ colors: true }, '%o', error)}`,

		// TODO: add link to GitHub issues
	].join('\n'));

	process.exitCode = 2;
}
