// https://regex101.com/r/Ly7O1x/3
module.exports = {
	passing: {

		// no parameter {{{
		'numbers only and no parameter #1': '"0.0.4"',
		'numbers only and no parameter #2': '"1.2.3"',
		'numbers only and no parameter #3': '"10.20.30"',
		'numbers only and no parameter #4': '"2.0.0"',
		'numbers only and no parameter #5': '"1.1.7"',
		'numbers only and no parameter #6': '"99999999999999999999999.999999999999999999.99999999999999999"',
		// }}}

		// `simple` {{{
		'numbers only and `simple` #1': ['"0.0.4"', 'simple'],
		'numbers only and `simple` #2': ['"1.2.3"', 'simple'],
		'numbers only and `simple` #3': ['"10.20.30"', 'simple'],
		'numbers only and `simple` #4': ['"2.0.0"', 'simple'],
		'numbers only and `simple` #5': ['"1.1.7"', 'simple'],
		'numbers only and `simple` #6': ['"99999999999999999999999.999999999999999999.99999999999999999"', 'simple'],
		// }}}

		// `extended` {{{
		'numbers only and `extended` #1': ['"0.0.4"', 'extended'],
		'numbers only and `extended` #2': ['"1.2.3"', 'extended'],
		'numbers only and `extended` #3': ['"10.20.30"', 'extended'],
		'numbers only and `extended` #4': ['"2.0.0"', 'extended'],
		'numbers only and `extended` #5': ['"1.1.7"', 'extended'],
		'numbers only and `extended` #6': ['"99999999999999999999999.999999999999999999.99999999999999999"', 'extended'],

		'numbers with suffix #01': ['"1.1.2-prerelease+meta"', 'extended'],
		'numbers with suffix #02': ['"1.1.2+meta"', 'extended'],
		'numbers with suffix #03': ['"1.1.2+meta-valid"', 'extended'],
		'numbers with suffix #04': ['"1.0.0-alpha"', 'extended'],
		'numbers with suffix #05': ['"1.0.0-beta"', 'extended'],
		'numbers with suffix #06': ['"1.0.0-alpha.beta"', 'extended'],
		'numbers with suffix #07': ['"1.0.0-alpha.beta.1"', 'extended'],
		'numbers with suffix #08': ['"1.0.0-alpha.1"', 'extended'],
		'numbers with suffix #09': ['"1.0.0-alpha0.valid"', 'extended'],
		'numbers with suffix #10': ['"2.0.0+build.1848"', 'extended'],
		'numbers with suffix #11': ['"1.0.0-alpha+beta"', 'extended'],
		'numbers with suffix #12': ['"1.2.3----RC-SNAPSHOT.12.9.1--.12+788"', 'extended'],
		'numbers with suffix #13': ['"1.2.3----R-S.12.9.1--.12+meta"', 'extended'],
		'numbers with suffix #14': ['"1.2.3----RC-SNAPSHOT.12.9.1--.12"', 'extended'],
		'numbers with suffix #15': ['"1.0.0+0.build.1-rc.10000aaa-kk-0.1"', 'extended'],
		// }}}

	}, failing: {

		// invalid parameters {{{
		'invalid parameter #1': [['""', true], 2],
		'invalid parameter #2': [['""', 'semver'], 2],
		'invalid parameter #3': [['""', ['simple', 'extended']], 2],
		// }}}

		// no parameter {{{
		'no parameter #01': ['""', "version doesn't follow semver"],
		'no parameter #02': ['"1"', "version doesn't follow semver"],
		'no parameter #03': ['"1.2"', "version doesn't follow semver"],
		'no parameter #04': ['"1.2.3-0123"', "version doesn't follow semver"],
		'no parameter #05': ['"1.2.3-0123.0123"', "version doesn't follow semver"],
		'no parameter #06': ['"1.1.2+.123"', "version doesn't follow semver"],
		'no parameter #07': ['"01.1.1"', "version doesn't follow semver"],
		'no parameter #08': ['"1.01.1"', "version doesn't follow semver"],
		'no parameter #09': ['"1.1.01"', "version doesn't follow semver"],
		'no parameter #10': ['"1.2"', "version doesn't follow semver"],
		// }}}

		// `simple` {{{
		'`simple` #01': [['""', 'simple'], "version doesn't follow semver"],
		'`simple` #02': [['"1.1.2-prerelease+meta"', 'simple'], "version doesn't follow semver"],
		'`simple` #03': [['"1.1.2+meta"', 'simple'], "version doesn't follow semver"],
		'`simple` #04': [['"1.1.2+meta-valid"', 'simple'], "version doesn't follow semver"],
		'`simple` #05': [['"1.0.0-alpha"', 'simple'], "version doesn't follow semver"],
		'`simple` #06': [['"1.0.0-beta"', 'simple'], "version doesn't follow semver"],
		'`simple` #07': [['"1.0.0-alpha.beta"', 'simple'], "version doesn't follow semver"],
		'`simple` #08': [['"1.0.0-alpha.beta.1"', 'simple'], "version doesn't follow semver"],
		'`simple` #09': [['"1.0.0-alpha.1"', 'simple'], "version doesn't follow semver"],
		'`simple` #10': [['"1.0.0-alpha0.valid"', 'simple'], "version doesn't follow semver"],
		'`simple` #11': [['"2.0.0+build.1848"', 'simple'], "version doesn't follow semver"],
		'`simple` #12': [['"1.0.0-alpha+beta"', 'simple'], "version doesn't follow semver"],
		'`simple` #13': [['"1.2.3----RC-SNAPSHOT.12.9.1--.12+788"', 'simple'], "version doesn't follow semver"],
		'`simple` #14': [['"1.2.3----R-S.12.9.1--.12+meta"', 'simple'], "version doesn't follow semver"],
		'`simple` #15': [['"1.2.3----RC-SNAPSHOT.12.9.1--.12"', 'simple'], "version doesn't follow semver"],
		'`simple` #16': [['"1.0.0+0.build.1-rc.10000aaa-kk-0.1"', 'simple'], "version doesn't follow semver"],
		// }}}

		// `extended` {{{
		'`extended` #01': [['""', 'extended'], "version doesn't follow extended semver"],
		'`extended` #02': [['"+invalid"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #03': [['"-invalid"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #04': [['"-invalid+invalid"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #05': [['"-invalid.01"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #06': [['"alpha"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #07': [['"alpha.beta"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #08': [['"alpha.beta.1"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #09': [['"alpha.1"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #10': [['"alpha+beta"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #11': [['"alpha_beta"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #12': [['"alpha."', 'extended'], "version doesn't follow extended semver"],
		'`extended` #13': [['"alpha.."', 'extended'], "version doesn't follow extended semver"],
		'`extended` #14': [['"beta"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #15': [['"1.0.0-alpha_beta"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #16': [['"-alpha."', 'extended'], "version doesn't follow extended semver"],
		'`extended` #17': [['"1.0.0-alpha.."', 'extended'], "version doesn't follow extended semver"],
		'`extended` #18': [['"1.0.0-alpha..1"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #19': [['"1.0.0-alpha...1"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #20': [['"1.0.0-alpha....1"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #21': [['"1.0.0-alpha.....1"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #22': [['"1.0.0-alpha......1"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #23': [['"1.0.0-alpha.......1"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #24': [['"01.1.1"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #25': [['"1.01.1"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #26': [['"1.1.01"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #27': [['"1.2"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #28': [['"1.2.3.DEV"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #29': [['"1.2-SNAPSHOT"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #30': [['"1.2.31.2.3----RC-SNAPSHOT.12.09.1--..12+788"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #31': [['"1.2-RC-SNAPSHOT"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #32': [['"-1.0.3-gamma+b7718"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #33': [['"+justmeta"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #34': [['"9.8.7+meta+meta"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #35': [['"9.8.7-whatever+meta+meta"', 'extended'], "version doesn't follow extended semver"],
		'`extended` #36': [['"999.999.999----RC-SNAPSHOT.12.09.1----..12"', 'extended'], "version doesn't follow extended semver"],
		// }}}

	},
};
