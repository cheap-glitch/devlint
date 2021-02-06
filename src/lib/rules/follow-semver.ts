import { RuleTargetType, RuleContext, RuleResult, RuleError, RuleErrorType } from '../rules';

export const targetType = RuleTargetType.JsonString;

export function validator({ lines, jsonString: version, jsonAst, parameter: flag }: RuleContext): RuleResult {
	if (flag !== undefined && flag !== 'simple' && flag !== 'extended') {
		return new RuleError(RuleErrorType.InvalidParameter);
	}

	if ((flag === undefined || flag === 'simple') && !/^((?:0|[1-9]\d*)\.){2}(?:0|[1-9]\d*)$/.test(version)) {
		return new RuleError("version doesn't follow semver", jsonAst?.pos, lines);
	}

	// https://semver.org/spec/v2.0.0.html#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
	if (flag === 'extended' && !/^((?:0|[1-9]\d*)\.){2}(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][\dA-Za-z-]*))*)?(?:\+[\dA-Za-z-]+(?:\.[\dA-Za-z-]+)*)?$/.test(version)) {
		return new RuleError("version doesn't follow extended semver", jsonAst?.pos, lines);
	}

	return true;
}
