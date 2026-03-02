export interface TextSegment {
	type: 'text' | 'bold' | 'italic' | 'strikethrough' | 'code' | 'codeblock' | 'link' | 'email' | 'tag';
	content: string;
	language?: string;
	url?: string;
	tag?: string;
}

export interface RenderFormattedTextProps {
	text?: string;
	isMy?: boolean;
	formatOnlyTags?: boolean;
	numberOfLines?: number;
	style?: import('react-native').ViewStyle;
	textStyle?: import('react-native').TextStyle;
	scrollEnabled?: boolean;
	onLinkPress?: (url: string) => void;
	onTagPress?: (tag: string) => void;
	onInviteLinkPress?: (url: string) => void;
	onStickerLinkPress?: (url: string) => void;
}

export interface Colors {
	text: string;
	textSecondary: string;
	link: string;
	linkText: string;
	codeBg: string;
	codeBlockBg: string;
	codeBlockBorder: string;
	codeBlockHeaderBg: string;
	codeText: string;
}

