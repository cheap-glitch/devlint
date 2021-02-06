import { JsonValue } from 'type-fest';

import { Line } from '../../helpers/text';
import { isJsonObject } from '../../helpers/json';
import { PropertiesPathSegments } from '../../helpers/properties';

import { RuleErrorLocation } from '../../errors';
import { RuleError, RuleErrorType } from '../../rules';

interface MarkdownHeader {
	text:      string,
	level:     number,
	fullMatch: string,
	index:     number,
}

export function getMarkdownHeaders(text: string): Array<MarkdownHeader> {
	return [...text.matchAll(/^(?<level>#{1,6})\s+(?<text>.+)$/g)].map(match => ({
		text:      match?.groups?.text.trim()  ?? '',
		level:     match?.groups?.level.length ??  0,
		fullMatch: match[0],
		index:     match.index ?? 0,
	}));
}

export function checkStringCase(testedString: string, caseStyle: string): boolean | RuleError {
	return (() => {
		switch (caseStyle) {
			case 'uppercase':
				return !/\p{Lowercase_Letter}/u.test(testedString);

			case 'lowercase':
				return !/\p{Uppercase_Letter}/u.test(testedString);

			case 'kebab':
				return /^[a-z](?:-?[a-z\d]+)*$/u.test(testedString);

			case 'kebab-extended':
				return /^@?[\da-z](?:[/-]?[\da-z]+)*$/.test(testedString);

			case 'snake':
				return /^[a-z](?:_?[\da-z]+)*$/.test(testedString);

			case 'camel':
				return /^[a-z][\da-z]+(?:[A-Z][\da-z]+)*$/.test(testedString);

			case 'pascal':
				return /^(?:[A-Z][\da-z]+)+$/.test(testedString);

			case 'sentence':
				return testedString.length > 0 && testedString.slice(0, 1)[0].toLocaleUpperCase() === testedString.slice(0, 1)[0];

			case 'title':
				return !/(^|\P{Letter})\p{Lowercase_Letter}/u.test(testedString);

			default: return new RuleError(RuleErrorType.InvalidParameter);
		}
	})() || testedString === '';
}

export function checkValueType(testedValue: JsonValue, type: string): boolean | RuleError {
	switch (type) {
		case 'null':
			return typeof testedValue === null;

		case 'boolean':
		case 'number':
		case 'string':
			return typeof testedValue === type;

		case 'object':
			return isJsonObject(testedValue);

		case 'array':
			return Array.isArray(testedValue);
	}

	return new RuleError(RuleErrorType.InvalidParameter);
}

export function matchJsonValues(model: JsonValue | undefined, value: JsonValue | undefined, propertiesPath: PropertiesPathSegments = []): true | PropertiesPathSegments {
	if (typeof model === 'string' && typeof value === 'string') {
		return matchStrings(model, value) || propertiesPath;
	}

	if (model === null || value === null || typeof model !== 'object' || typeof value !== 'object') {
		return (model === value) || propertiesPath;
	}

	if (Array.isArray(model) || Array.isArray(value)) {
		if (!Array.isArray(model) || !Array.isArray(value) || model.length !== value.length) {
			return propertiesPath;
		}

		for (const [index, item] of model.entries()) {
			const result = matchJsonValues(item, value[index], [...propertiesPath, index]);
			if (result !== true) {
				return result;
			}
		}

		return true;
	}

	for (const keySelector of Object.keys(model)) {
		const key = keySelector.replace(/\?$/, '');
		if (keySelector.endsWith('?') && value[key] === undefined) {
			continue;
		}

		const result = matchJsonValues(model[keySelector], value[key], [...propertiesPath, key]);
		if (result !== true) {
			return result;
		}
	}

	return true;
}

export function matchJsonPrimitives(model: JsonValue, value: JsonValue): boolean {
	return (typeof model === 'string' && typeof value === 'string') ? matchStrings(model, value) : model === value;
}

export function matchStrings(model: string, value: string): boolean {
	return isRegex(model) ? new RegExp(model.slice(1, -1)).test(value) : model === value;
}

export function isRegex(model: string): boolean {
	return model.startsWith('/') && model.endsWith('/');
}

export function findMatchLocation(lines: Array<Line>, matchText: string, matchIndex: number): RuleErrorLocation {
	const matchLineStart = lines.findIndex(line => line.char + line.text.length - 1 >= matchIndex);
	const matchLineEnd   = lines.findIndex(line => line.char + line.text.length - 1 >= matchIndex + matchText.length - 1);

	return {
		start: matchLineStart !== -1 ? {
			line:   matchLineStart + 1,
			column: matchIndex - lines[matchLineStart].char + 1,
			char:   matchIndex
		} : undefined,

		end: matchLineEnd !== -1 ? {
			line:   matchLineEnd + 1,
			column: matchIndex - lines[matchLineEnd].char + matchText.length,
			char:   matchIndex + matchText.length - 1
		} : undefined,
	};
}
