import { NativeModules, Platform } from 'react-native';

const { SaiContextMenuModule } = NativeModules;

export interface ContextMenuItem {
	id: string;
	label: string;
	icon?: string;
	isDestructive?: boolean;
}

export interface ContextMenuOptions {
	targetX: number;
	targetY: number;
	targetWidth: number;
	targetHeight: number;

	// Content selection effect
	previewType?: 'original' | 'custom';
	customPreviewContent?: string; // For mock preview data

	// Layout
	horizontalPosition?: 'left' | 'right' | 'center';
	menuWidth?: number;
	offsetX?: number;
	offsetY?: number;

	// Reactions
	showReactions?: boolean;
	reactions?: string[];

	message: {
		content: string;
		isMe: boolean;
		senderName?: string;
		[key: string]: any;
	};

	items: ContextMenuItem[];
}

/**
 * Shows a native Telegram-like context menu
 */
export const showNativeContextMenu = (options: ContextMenuOptions): Promise<string> => {
	if (Platform.OS !== 'ios') {
		return Promise.reject('Native context menu is only available on iOS');
	}

	// Default values
	const finalOptions = {
		previewType: 'original',
		horizontalPosition: options.message.isMe ? 'right' : 'left',
		showReactions: true,
		menuWidth: 250,
		offsetX: 0,
		offsetY: 0,
		...options
	};

	return new Promise((resolve) => {
		SaiContextMenuModule.showMenu(finalOptions, (actionId: string) => {
			resolve(actionId);
		});
	});
};
