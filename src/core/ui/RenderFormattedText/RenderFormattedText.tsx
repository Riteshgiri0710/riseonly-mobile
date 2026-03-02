import { changeRgbA } from '@lib/theme';
import { observer } from 'mobx-react-lite';
import { tagActionsStore } from 'src/core/stores/tag';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';
import { parseText, parseTextTagsOnly } from './parser';
import { renderSegments } from './renderer';
import { styles } from './styles';
import { Colors, RenderFormattedTextProps } from './types';

const testTextToRenderFromComponent = `This is a long formatting test text for a native rich text editor.

Normal text should look plain and readable without any styling applied.

***This is bold text***

___This is italic text___

~~~This text is strikethrough~~~

***Bold and ___italic___ together***

Here is a link: https://example.com
Here is an email: test@example.com

Inline code example: \`const x = 42;\`

JavaScript code block:

\`\`\`js
const a = "js code";
// JS comment
function test(value) {
  if (value > 0) {
    console.log("Positive:", value);
  } else {
    console.log("Not positive");
  }
}
test(5);
\`\`\`

Python code block:

\`\`\`python
def hello(name):
    # Python comment
    print(f"Hello, {name}")
    return name.upper()

hello("World")
\`\`\`

C code block:

\`\`\`c
#include <stdio.h>

int main() {
    // C comment
    int x = 42;
    printf("Hello, World!\\n");
    return 0;
}
\`\`\`

Rust code block:

\`\`\`rust
fn main() {
    // Rust comment
    let name = "World";
    println!("Hello, {}!", name);
}
\`\`\`

Text after code block should continue normally.

Now testing mixed formatting in one paragraph:
This is ***bold***, this is *italic*,
and this is ~~strikethrough~~ all in one sentence.

Testing nested formatting:
***Bold text with another ___format inside___ inside***

Testing extreme cases:
*******Multiple stars should work*******
_______Multiple underscores_______

Testing multiline bold:
***
This whole block
should be bold
across multiple lines
***
Testing emojis 😄🔥🚀 inside text.

Testing spacing and empty lines.

Text after multiple empty lines should still render correctly.

Testing long text wrapping behavior:
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Testing special characters:
{} [] () <> @#$%^&*+=_|~\`

Testing tags:
Here is a tag @nics51 and another one @user123. Short tags like @ab or @xy should not be formatted. Very long tags like @this_is_a_very_long_tag_name_that_exceeds_32_characters should also not be formatted. Normal tags @test_user and @admin123 should work correctly.

End of formatting stress test.`;

export const RenderFormattedText = observer(({
	text = testTextToRenderFromComponent,
	style,
	numberOfLines,
	textStyle,
	scrollEnabled = false,
	onLinkPress,
	onTagPress,
	onInviteLinkPress,
	onStickerLinkPress,
	isMy = false,
	formatOnlyTags = false,
}: RenderFormattedTextProps) => {
	const { searchByTagAndNavigateAction } = tagActionsStore;

	const handleTagPress = (tag: string) => {
		if (onTagPress) {
			onTagPress(tag);
		} else {
			searchByTagAndNavigateAction(tag);
		}
	};
	const { currentTheme } = themeStore;

	const { t } = useTranslation();

	const colors: Colors = useMemo(() => ({
		text: currentTheme.text_100 as string,
		textSecondary: currentTheme.secondary_100 as string,
		link: isMy ? currentTheme.text_100 : currentTheme.primary_100,
		linkText: currentTheme.text_100 as string,
		codeBg: changeRgbA(currentTheme.primary_100 as string, '0.15'),
		codeBlockBg: changeRgbA(currentTheme.bg_300 as string, '1'),
		codeBlockBorder: changeRgbA(currentTheme.primary_100 as string, '0.3'),
		codeBlockHeaderBg: changeRgbA(currentTheme.primary_100 as string, '0.1'),
		codeText: currentTheme.text_100 as string,
	}), [currentTheme]);

	const segments = useMemo(
		() => (formatOnlyTags ? parseTextTagsOnly(text) : parseText(text)),
		[text, formatOnlyTags]
	);

	const renderedElements = useMemo(() => {
		return renderSegments({
			segments,
			colors,
			textStyle,
			numberOfLines,
			formatOnlyTags,
			onLinkPress,
			onTagPress: handleTagPress,
			onInviteLinkPress,
			onStickerLinkPress,
			t,
		});
	}, [segments, colors, textStyle, numberOfLines, formatOnlyTags, onLinkPress, onInviteLinkPress, onStickerLinkPress]);

	const content = renderedElements;

	if (scrollEnabled) {
		return (
			<ScrollView
				style={style}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={true}
				horizontal={true}
				showsHorizontalScrollIndicator={false}
				nestedScrollEnabled={true}
			>
				{content}
			</ScrollView>
		);
	}

	return content;
});
