import React from 'react';
import { Text } from 'react-native';

interface Token {
	type: 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'operator' | 'text';
	value: string;
}

const JS_KEYWORDS = new Set([
	'const', 'let', 'var', 'function', 'if', 'else', 'for', 'while', 'return',
	'true', 'false', 'null', 'undefined', 'this', 'new', 'class', 'extends',
	'import', 'export', 'default', 'async', 'await', 'try', 'catch', 'finally',
	'switch', 'case', 'break', 'continue', 'do', 'typeof', 'instanceof', 'in',
	'of', 'void', 'delete', 'with', 'debugger', 'yield', 'super', 'static'
]);

const PYTHON_KEYWORDS = new Set([
	'def', 'class', 'if', 'elif', 'else', 'for', 'while', 'try', 'except',
	'finally', 'with', 'as', 'import', 'from', 'return', 'yield', 'pass',
	'break', 'continue', 'and', 'or', 'not', 'in', 'is', 'None', 'True', 'False',
	'lambda', 'global', 'nonlocal', 'assert', 'raise', 'del'
]);

const C_KEYWORDS = new Set([
	'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
	'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'int',
	'long', 'register', 'return', 'short', 'signed', 'sizeof', 'static', 'struct',
	'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while'
]);

const RUST_KEYWORDS = new Set([
	'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn',
	'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in',
	'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return',
	'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type',
	'unsafe', 'use', 'where', 'while'
]);

const OPERATORS = ['+', '-', '*', '/', '%', '=', '==', '===', '!=', '!==', '<', '>', '<=', '>=', '&&', '||', '!', '?', ':', '=>', '->', '::', '..', '..='];

const getKeywords = (language: string): Set<string> => {
	const lang = language.toLowerCase();
	if (lang === 'js' || lang === 'javascript' || lang === 'ts' || lang === 'typescript') {
		return JS_KEYWORDS;
	}
	if (lang === 'py' || lang === 'python') {
		return PYTHON_KEYWORDS;
	}
	if (lang === 'c' || lang === 'cpp' || lang === 'c++' || lang === 'h' || lang === 'hpp') {
		return C_KEYWORDS;
	}
	if (lang === 'rs' || lang === 'rust') {
		return RUST_KEYWORDS;
	}
	return new Set();
};

export const highlightCode = (code: string, language: string, colors: { text: string; keyword: string; string: string; comment: string; function: string; }): React.ReactElement => {
	const tokens: Token[] = [];
	let current = 0;
	const keywords = getKeywords(language);
	const isPython = language.toLowerCase() === 'py' || language.toLowerCase() === 'python';
	const isC = ['c', 'cpp', 'c++', 'h', 'hpp'].includes(language.toLowerCase());
	const isRust = language.toLowerCase() === 'rs' || language.toLowerCase() === 'rust';

	while (current < code.length) {
		if (isPython && code.substring(current).startsWith('#')) {
			const end = code.indexOf('\n', current);
			if (end === -1) {
				tokens.push({ type: 'comment', value: code.substring(current) });
				break;
			}
			tokens.push({ type: 'comment', value: code.substring(current, end) });
			current = end;
			continue;
		}

		if ((isC || isRust) && code.substring(current).startsWith('//')) {
			const end = code.indexOf('\n', current);
			if (end === -1) {
				tokens.push({ type: 'comment', value: code.substring(current) });
				break;
			}
			tokens.push({ type: 'comment', value: code.substring(current, end) });
			current = end;
			continue;
		}

		if ((isC || isRust) && code.substring(current).startsWith('/*')) {
			const end = code.indexOf('*/', current);
			if (end === -1) {
				tokens.push({ type: 'comment', value: code.substring(current) });
				break;
			}
			tokens.push({ type: 'comment', value: code.substring(current, end + 2) });
			current = end + 2;
			continue;
		}

		if (code[current] === '"' || code[current] === "'" || code[current] === '`') {
			const quote = code[current];
			let end = current + 1;
			while (end < code.length && code[end] !== quote) {
				if (code[end] === '\\') end += 2;
				else end++;
			}
			if (end < code.length) end++;
			tokens.push({ type: 'string', value: code.substring(current, end) });
			current = end;
			continue;
		}

		if (/[0-9]/.test(code[current])) {
			let end = current;
			while (end < code.length && /[0-9.xXeE+-]/.test(code[end])) end++;
			tokens.push({ type: 'number', value: code.substring(current, end) });
			current = end;
			continue;
		}

		if (/[a-zA-Z_$]/.test(code[current])) {
			let end = current;
			while (end < code.length && /[a-zA-Z0-9_$]/.test(code[end])) end++;
			const word = code.substring(current, end);
			if (keywords.has(word)) {
				tokens.push({ type: 'keyword', value: word });
			} else if (end < code.length && code[end] === '(') {
				tokens.push({ type: 'function', value: word });
			} else {
				tokens.push({ type: 'text', value: word });
			}
			current = end;
			continue;
		}

		if (OPERATORS.some(op => code.substring(current).startsWith(op))) {
			const op = OPERATORS.find(o => code.substring(current).startsWith(o)) || code[current];
			tokens.push({ type: 'operator', value: op });
			current += op.length;
			continue;
		}

		tokens.push({ type: 'text', value: code[current] });
		current++;
	}

	return (
		<>
			{tokens.map((token, index) => {
				let color = colors.text;
				if (token.type === 'keyword') color = colors.keyword;
				else if (token.type === 'string') color = colors.string;
				else if (token.type === 'comment') color = colors.comment;
				else if (token.type === 'function') color = colors.function;

				return (
					<Text key={index} style={{ color }}>
						{token.value}
					</Text>
				);
			})}
		</>
	);
};
