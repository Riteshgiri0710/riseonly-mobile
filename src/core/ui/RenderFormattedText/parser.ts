import { TextSegment } from './types';

const MAX_TEXT_LENGTH = 100000;

export const parseText = (input: string): TextSegment[] => {
	if (input.length > MAX_TEXT_LENGTH) {
		return [{ type: 'text', content: input.substring(0, MAX_TEXT_LENGTH) + '...\n\n[Text too long, truncated]' }];
	}

	const segments: TextSegment[] = [];
	const codeBlockMatches: Array<{ index: number; length: number; language: string; code: string; }> = [];

	const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
	let match;
	while ((match = codeBlockRegex.exec(input)) !== null) {
		if (match.index !== undefined) {
			codeBlockMatches.push({
				index: match.index,
				length: match[0].length,
				language: match[1] || '',
				code: match[2].trim()
			});
		}
	}

	let lastIndex = 0;
	const textParts: Array<{ text: string; isCodeBlock: boolean; language?: string; code?: string; }> = [];

	for (const codeBlock of codeBlockMatches) {
		if (codeBlock.index > lastIndex) {
			textParts.push({ text: input.substring(lastIndex, codeBlock.index), isCodeBlock: false });
		}
		textParts.push({ text: '', isCodeBlock: true, language: codeBlock.language, code: codeBlock.code });
		lastIndex = codeBlock.index + codeBlock.length;
	}
	if (lastIndex < input.length) {
		textParts.push({ text: input.substring(lastIndex), isCodeBlock: false });
	}

	const parseNestedFormatting = (content: string): TextSegment[] => {
		const nested: TextSegment[] = [];
		let pos = 0;

		while (pos < content.length) {
			const boldMatch = content.substring(pos).match(/^(\*\*|__)(.+?)\1/);
			const italicMatch = content.substring(pos).match(/^(?<!\*)(?<!_)(\*|_)([^*_\n]+?)\1(?!\*)(?!_)/);
			const strikeMatch = content.substring(pos).match(/^~~(.+?)~~/);

			if (boldMatch && boldMatch.index === 0) {
				const inner = parseNestedFormatting(boldMatch[2]);
				nested.push({ type: 'bold', content: boldMatch[2] });
				pos += boldMatch[0].length;
			} else if (italicMatch && italicMatch.index === 0) {
				nested.push({ type: 'italic', content: italicMatch[2] });
				pos += italicMatch[0].length;
			} else if (strikeMatch && strikeMatch.index === 0) {
				nested.push({ type: 'strikethrough', content: strikeMatch[1] });
				pos += strikeMatch[0].length;
			} else {
				const next = Math.min(
					content.indexOf('**', pos) === -1 ? Infinity : content.indexOf('**', pos),
					content.indexOf('__', pos) === -1 ? Infinity : content.indexOf('__', pos),
					content.indexOf('*', pos) === -1 ? Infinity : content.indexOf('*', pos),
					content.indexOf('_', pos) === -1 ? Infinity : content.indexOf('_', pos),
					content.indexOf('~~', pos) === -1 ? Infinity : content.indexOf('~~', pos)
				);
				if (next === Infinity) {
					nested.push({ type: 'text', content: content.substring(pos) });
					break;
				}
				if (next > pos) {
					nested.push({ type: 'text', content: content.substring(pos, next) });
				}
				pos = next;
			}
		}

		return nested;
	};

	for (const part of textParts) {
		if (part.isCodeBlock && part.code) {
			segments.push({
				type: 'codeblock',
				content: part.code,
				language: part.language
			});
			continue;
		}

		let text = part.text;
		let position = 0;

		const findNextMatch = (str: string, startPos: number): { index: number; type: TextSegment['type']; content: string; length: number; url?: string; tag?: string; } | null => {
			let bestMatch: { index: number; type: TextSegment['type']; content: string; length: number; url?: string; tag?: string; } | null = null;

			const updateBestMatch = (index: number, type: TextSegment['type'], content: string, length: number, url?: string, tag?: string) => {
				if (bestMatch === null || index < bestMatch.index) {
					bestMatch = { index, type, content, length, url, tag };
				}
			};


			let boldPos = startPos;
			while (boldPos < str.length) {
				const boldIndex = str.indexOf('***', boldPos);
				if (boldIndex === -1) break;

				const beforeOpen = boldIndex > 0 ? str[boldIndex - 1] : '';
				const afterOpen = boldIndex + 3 < str.length ? str[boldIndex + 3] : '';
				if (beforeOpen === '*' || afterOpen === '*') {
					boldPos = boldIndex + 1;
					continue;
				}

				const closeIndex = str.indexOf('***', boldIndex + 3);
				if (closeIndex === -1) break;

				const beforeClose = closeIndex > 0 ? str[closeIndex - 1] : '';
				const afterClose = closeIndex + 3 < str.length ? str[closeIndex + 3] : '';
				if (beforeClose === '*' || afterClose === '*') {
					boldPos = closeIndex + 1;
					continue;
				}

				const content = str.substring(boldIndex + 3, closeIndex);
				updateBestMatch(boldIndex, 'bold', content, closeIndex + 3 - boldIndex);
				break;
			}

			let italicPos = startPos;
			while (italicPos < str.length) {
				const italicIndex = str.indexOf('___', italicPos);
				if (italicIndex === -1) break;

				const beforeOpen = italicIndex > 0 ? str[italicIndex - 1] : '';
				const afterOpen = italicIndex + 3 < str.length ? str[italicIndex + 3] : '';
				if (beforeOpen === '_' || afterOpen === '_') {
					italicPos = italicIndex + 1;
					continue;
				}

				const closeIndex = str.indexOf('___', italicIndex + 3);
				if (closeIndex === -1) break;

				const beforeClose = closeIndex > 0 ? str[closeIndex - 1] : '';
				const afterClose = closeIndex + 3 < str.length ? str[closeIndex + 3] : '';
				if (beforeClose === '_' || afterClose === '_') {
					italicPos = closeIndex + 1;
					continue;
				}

				const content = str.substring(italicIndex + 3, closeIndex);
				updateBestMatch(italicIndex, 'italic', content, closeIndex + 3 - italicIndex);
				break;
			}

			let strikePos = startPos;
			while (strikePos < str.length) {
				const strikeIndex = str.indexOf('~~~', strikePos);
				if (strikeIndex === -1) break;

				const beforeOpen = strikeIndex > 0 ? str[strikeIndex - 1] : '';
				const afterOpen = strikeIndex + 3 < str.length ? str[strikeIndex + 3] : '';
				if (beforeOpen === '~' || afterOpen === '~') {
					strikePos = strikeIndex + 1;
					continue;
				}

				const closeIndex = str.indexOf('~~~', strikeIndex + 3);
				if (closeIndex === -1) break;

				const beforeClose = closeIndex > 0 ? str[closeIndex - 1] : '';
				const afterClose = closeIndex + 3 < str.length ? str[closeIndex + 3] : '';
				if (beforeClose === '~' || afterClose === '~') {
					strikePos = closeIndex + 1;
					continue;
				}

				const content = str.substring(strikeIndex + 3, closeIndex);
				updateBestMatch(strikeIndex, 'strikethrough', content, closeIndex + 3 - strikeIndex);
				break;
			}

			const codeInlineMatch = str.substring(startPos).match(/`([^`\n]+)`/);
			if (codeInlineMatch && codeInlineMatch.index !== undefined) {
				const index = startPos + codeInlineMatch.index;
				updateBestMatch(index, 'code', codeInlineMatch[1], codeInlineMatch[0].length);
			}


			const urlMatch = str.substring(startPos).match(/(https?:\/\/[^\s*_~`]+)/);
			if (urlMatch && urlMatch.index !== undefined) {
				const index = startPos + urlMatch.index;
				updateBestMatch(index, 'link', urlMatch[1], urlMatch[0].length, urlMatch[1]);
			}

			const emailMatch = str.substring(startPos).match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
			if (emailMatch && emailMatch.index !== undefined) {
				const index = startPos + emailMatch.index;
				updateBestMatch(index, 'email', emailMatch[1], emailMatch[0].length, `mailto:${emailMatch[1]}`);
			}

			const tagMatch = str.substring(startPos).match(/@([a-zA-Z0-9_]{3,32})(?![a-zA-Z0-9_])/);
			if (tagMatch && tagMatch.index !== undefined) {
				const index = startPos + tagMatch.index;
				const tagName = tagMatch[1];
				updateBestMatch(index, 'tag', `@${tagName}`, tagMatch[0].length, undefined, tagName);
			}

			return bestMatch;
		};

		while (position < text.length) {
			const match = findNextMatch(text, position);

			if (match && match.index !== undefined) {
				if (match.index > position) {
					const before = text.substring(position, match.index);
					if (before.trim() || before.includes('\n')) {
						segments.push({ type: 'text', content: before });
					}
				}

				if (match.type === 'bold') {
					const content = match.content;
					const nestedItalicMatch = content.match(/___([^_]+?)___/);

					if (nestedItalicMatch && nestedItalicMatch.index !== undefined) {
						if (nestedItalicMatch.index > 0) {
							segments.push({ type: 'bold', content: content.substring(0, nestedItalicMatch.index) });
						}
						segments.push({ type: 'italic', content: nestedItalicMatch[1] });
						if (nestedItalicMatch.index + nestedItalicMatch[0].length < content.length) {
							segments.push({ type: 'bold', content: content.substring(nestedItalicMatch.index + nestedItalicMatch[0].length) });
						}
					} else {
						segments.push({
							type: match.type,
							content: match.content,
							url: match.url
						});
					}
				} else {
					segments.push({
						type: match.type,
						content: match.content,
						url: match.url,
						tag: match.tag
					});
				}

				position = match.index + match.length;
			} else {
				const remaining = text.substring(position);
				if (remaining) {
					segments.push({ type: 'text', content: remaining });
				}
				break;
			}
		}
	}

	const normalizedSegments: TextSegment[] = [];
	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i];
		const prevSegment = segments[i - 1];
		const nextSegment = segments[i + 1];

		if (segment.type === 'text') {
			let content = segment.content;

			const prevIsCodeBlock = prevSegment?.type === 'codeblock';
			const nextIsCodeBlock = nextSegment?.type === 'codeblock';
			const prevIsFormatting = prevSegment && prevSegment.type !== 'text' && prevSegment.type !== 'codeblock' && prevSegment.type !== 'code';

			if (prevIsCodeBlock || nextIsCodeBlock) {
				if (content) {
					normalizedSegments.push({ type: 'text', content });
				}
				continue;
			}

			content = content.replace(/\n{4,}/g, '\n\n\n');

			if (content) {
				normalizedSegments.push({ type: 'text', content });
			}
		} else {
			normalizedSegments.push(segment);
		}
	}

	return normalizedSegments;
};

export const parseTextTagsOnly = (input: string): TextSegment[] => {
	if (input.length > MAX_TEXT_LENGTH) {
		return [{ type: 'text', content: input.substring(0, MAX_TEXT_LENGTH) + '...' }];
	}
	const segments: TextSegment[] = [];
	let position = 0;
	const tagRe = /@([a-zA-Z0-9_]{3,32})(?![a-zA-Z0-9_])/g;
	let match: RegExpExecArray | null;
	while ((match = tagRe.exec(input)) !== null) {
		if (match.index > position) {
			segments.push({ type: 'text', content: input.substring(position, match.index) });
		}
		segments.push({
			type: 'tag',
			content: match[0],
			tag: match[1],
		});
		position = match.index + match[0].length;
	}
	if (position < input.length) {
		segments.push({ type: 'text', content: input.substring(position) });
	}
	return segments.length > 0 ? segments : [{ type: 'text', content: input }];
};
