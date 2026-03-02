declare module 'react-native-rich-editor' {
	import React from 'react'

	export interface RichEditorProps {
		initialContentHTML?: string
		editorInitializedCallback?: () => void
		onChange?: (text: string) => void
		onHeightChange?: (height: number) => void
		editorStyle?: object
		containerStyle?: object
		style?: object
		placeholder?: string
		initialHeight?: number
		disabled?: boolean
		useContainer?: boolean
		pasteAsPlainText?: boolean
		autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
		defaultParagraphSeparator?: string
		initialFocus?: boolean
		onFocus?: () => void
		onBlur?: () => void
		onPaste?: (data: string) => void
		onKeyUp?: (data: string) => void
		onKeyDown?: (data: string) => void
		onInput?: (data: string) => void
		onMessage?: (data: string) => void
		onCursorPosition?: (offsetY: number) => void
		onSelectionChange?: (data: { start: number; end: number }) => void
		onActiveStyleChanged?: (styles: string[]) => void
		placeholderColor?: string
		contentCSSText?: string
		useContainer?: boolean
		initialFocus?: boolean
	}

	export class RichEditor extends React.Component<RichEditorProps> {
		setContentHTML: (html: string) => void
		blurContentEditor: () => void
		focusContentEditor: () => void
		insertImage: (url: string, alt?: string) => void
		insertLink: (url: string, title?: string) => void
		insertText: (text: string) => void
		insertHTML: (html: string) => void
		insertVideo: (url: string) => void
		setContentFocusHandler: (handler: () => void) => void
		registerToolbar: (handler: (items: any) => void) => void
	}

	export interface RichToolbarProps {
		getEditor?: () => RichEditor
		editor?: RichEditor
		selectedIconTint?: string
		iconTint?: string
		unselectedButtonStyle?: object
		selectedButtonStyle?: object
		disabledButtonStyle?: object
		disabledIconTint?: string
		onPressAddImage?: () => void
		onInsertLink?: () => void
		iconSize?: number
		iconMap?: Record<string, any>
		actions?: string[]
		style?: object
		flatContainerStyle?: object
		disabled?: boolean
	}

	export class RichToolbar extends React.Component<RichToolbarProps> { }

	export const actions: {
		insertImage: string
		setBold: string
		setItalic: string
		insertBulletsList: string
		insertOrderedList: string
		insertLink: string
		setStrikethrough: string
		setUnderline: string
		removeFormat: string
		undo: string
		redo: string
		checkboxList: string
		insertVideo: string
		alignLeft: string
		alignCenter: string
		alignRight: string
		alignFull: string
		setSubscript: string
		setSuperscript: string
		setIndent: string
		setOutdent: string
		insertTable: string
		code: string
		fontName: string
		fontSize: string
		setHeading: string
		setLineHeight: string
		setBlockquote: string
		setParagraph: string
		setPlaceholder: string
		setBackgroundColor: string
		setTextColor: string
	}
} 