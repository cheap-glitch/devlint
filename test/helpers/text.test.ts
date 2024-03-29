import { checkStringCase } from '../../src/lib/helpers/text';

describe('checkStringCase', () => {

	test('uppercase', () => { // {{{

		expect(checkStringCase('', 'uppercase')).toBe(true);
		expect(checkStringCase('WORD', 'uppercase')).toBe(true);
		expect(checkStringCase("I'M SHOUTING!", 'uppercase')).toBe(true);
		expect(checkStringCase('ŮNÏCØDE FTW', 'uppercase')).toBe(true);

		expect(checkStringCase('not uppercase', 'uppercase')).toBe(false);
		expect(checkStringCase('ALMOST UPPERCASe', 'uppercase')).toBe(false);
		expect(checkStringCase('ůNïCøDE FTW', 'uppercase')).toBe(false);

	}); // }}}

	test('lowercase', () => { // {{{

		expect(checkStringCase('', 'lowercase')).toBe(true);
		expect(checkStringCase('word', 'lowercase')).toBe(true);
		expect(checkStringCase('lowerc4s3 for3v4r', 'lowercase')).toBe(true);
		expect(checkStringCase('ůniçøde lówercäsê', 'lowercase')).toBe(true);

		expect(checkStringCase('WORD', 'lowercase')).toBe(false);
		expect(checkStringCase("I'M SHOUTING!", 'lowercase')).toBe(false);
		expect(checkStringCase('almost lowercasE', 'lowercase')).toBe(false);
		expect(checkStringCase('ŮniÇøde lówercÄsÊ', 'lowercase')).toBe(false);

	}); // }}}

	test('kebab', () => { // {{{

		expect(checkStringCase('', 'kebab')).toBe(true);
		expect(checkStringCase('word', 'kebab')).toBe(true);
		expect(checkStringCase('foo-bar', 'kebab')).toBe(true);
		expect(checkStringCase('foo-bar-baz', 'kebab')).toBe(true);
		expect(checkStringCase('foobar-28', 'kebab')).toBe(true);

		expect(checkStringCase('not kebab', 'kebab')).toBe(false);
		expect(checkStringCase('Not-Kebab', 'kebab')).toBe(false);
		expect(checkStringCase('not--kebab', 'kebab')).toBe(false);
		expect(checkStringCase('-not-kebab', 'kebab')).toBe(false);

	}); // }}}

	test('kebab-extended', () => { // {{{

		expect(checkStringCase('', 'kebab-extended')).toBe(true);
		expect(checkStringCase('word', 'kebab-extended')).toBe(true);
		expect(checkStringCase('foo-bar', 'kebab-extended')).toBe(true);
		expect(checkStringCase('foo-bar-baz', 'kebab-extended')).toBe(true);
		expect(checkStringCase('@scope/package-name', 'kebab-extended')).toBe(true);
		expect(checkStringCase('@scope/my-package', 'kebab-extended')).toBe(true);

		expect(checkStringCase('not kebab', 'kebab-extended')).toBe(false);
		expect(checkStringCase('Not-Kebab', 'kebab-extended')).toBe(false);
		expect(checkStringCase('not--kebab', 'kebab-extended')).toBe(false);
		expect(checkStringCase('-not-kebab', 'kebab-extended')).toBe(false);
		expect(checkStringCase('/not-kebab', 'kebab-extended')).toBe(false);
		expect(checkStringCase('not-@kebab', 'kebab-extended')).toBe(false);

	}); // }}}

	test('snake', () => { // {{{

		expect(checkStringCase('', 'snake')).toBe(true);
		expect(checkStringCase('im_a_snake', 'snake')).toBe(true);
		expect(checkStringCase('snakey', 'snake')).toBe(true);
		expect(checkStringCase('there_is_99_snakes', 'snake')).toBe(true);

		expect(checkStringCase('not a snake', 'snake')).toBe(false);
		expect(checkStringCase('not_a_snake!', 'snake')).toBe(false);
		expect(checkStringCase('not__a___snake', 'snake')).toBe(false);
		expect(checkStringCase('not_A_snake', 'snake')).toBe(false);
		expect(checkStringCase('not_a_snake_', 'snake')).toBe(false);

	}); // }}}

	test('camel', () => { // {{{

		expect(checkStringCase('', 'camel')).toBe(true);
		expect(checkStringCase('camel', 'camel')).toBe(true);
		expect(checkStringCase('camelCase', 'camel')).toBe(true);
		expect(checkStringCase('foo123Bar', 'camel')).toBe(true);
		expect(checkStringCase('camelCaseForever', 'camel')).toBe(true);

		expect(checkStringCase('FakeCamel', 'camel')).toBe(false);
		expect(checkStringCase('fakeCameL', 'camel')).toBe(false);
		expect(checkStringCase('fake_camel', 'camel')).toBe(false);
		expect(checkStringCase('fake camel', 'camel')).toBe(false);

	}); // }}}

	test('pascal', () => { // {{{

		expect(checkStringCase('', 'pascal')).toBe(true);
		expect(checkStringCase('Pascal', 'pascal')).toBe(true);
		expect(checkStringCase('PascalCase', 'pascal')).toBe(true);
		expect(checkStringCase('Foo123Bar', 'pascal')).toBe(true);
		expect(checkStringCase('PascalCaseForever', 'pascal')).toBe(true);

		expect(checkStringCase('notPascal', 'pascal')).toBe(false);
		expect(checkStringCase('NotPascaL', 'pascal')).toBe(false);
		expect(checkStringCase('definitely_not-pascal', 'pascal')).toBe(false);

	}); // }}}

	test('sentence', () => { // {{{

		expect(checkStringCase('', 'sentence')).toBe(true);
		expect(checkStringCase('This is a sentence', 'sentence')).toBe(true);
		expect(checkStringCase('Word', 'sentence')).toBe(true);
		expect(checkStringCase('ALL CAPS', 'sentence')).toBe(true);

		expect(checkStringCase('this is a sentence', 'sentence')).toBe(false);
		expect(checkStringCase('wORD', 'sentence')).toBe(false);
		expect(checkStringCase('nEvErMiNd', 'sentence')).toBe(false);

	}); // }}}

	test('title', () => { // {{{

		expect(checkStringCase('', 'title')).toBe(true);
		expect(checkStringCase('Title', 'title')).toBe(true);
		expect(checkStringCase('This Is A Title', 'title')).toBe(true);
		expect(checkStringCase('This Is A TITLE', 'title')).toBe(true);
		expect(checkStringCase('Thiß Tîtle Ůses Ünicóðe', 'title')).toBe(true);

		expect(checkStringCase('notatitle', 'title')).toBe(false);
		expect(checkStringCase('Not a title', 'title')).toBe(false);
		expect(checkStringCase('Not a Title', 'title')).toBe(false);
		expect(checkStringCase('Nöt À ŧitle', 'title')).toBe(false);

	}); // }}}

});
