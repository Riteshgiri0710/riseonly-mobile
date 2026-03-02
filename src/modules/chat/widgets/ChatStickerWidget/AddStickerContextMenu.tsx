import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { contextMenuStyles } from './styles';
import type { PackRecord } from './types';

interface AddStickerContextMenuProps {
	visible: boolean;
	pack: PackRecord | null;
	textColor: string;
	backgroundColor: string;
	onClose: () => void;
	onPickPhoto: () => void;
	onPickJson: () => void;
	onReorderPack?: (pack: PackRecord) => void;
}

export function AddStickerContextMenu({
	visible,
	pack,
	textColor,
	backgroundColor,
	onClose,
	onPickPhoto,
	onPickJson,
	onReorderPack,
}: AddStickerContextMenuProps) {
	return (
		<Modal
			visible={visible}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<TouchableOpacity
				style={contextMenuStyles.backdrop}
				activeOpacity={1}
				onPress={onClose}
			>
				<View style={[contextMenuStyles.box, { backgroundColor }]}>
					<TouchableOpacity style={contextMenuStyles.item} onPress={onPickPhoto}>
						<MaterialIcons name="image" size={22} color={textColor} />
						<Text style={[contextMenuStyles.label, { color: textColor }]}>Photo</Text>
					</TouchableOpacity>
					<TouchableOpacity style={contextMenuStyles.item} onPress={onPickJson}>
						<MaterialIcons name="description" size={22} color={textColor} />
						<Text style={[contextMenuStyles.label, { color: textColor }]}>Upload .json (Lottie)</Text>
					</TouchableOpacity>
					{pack?.is_admin && onReorderPack && (
						<TouchableOpacity
							style={contextMenuStyles.item}
							onPress={() => {
								onReorderPack(pack);
								onClose();
							}}
						>
							<MaterialIcons name="reorder" size={22} color={textColor} />
							<Text style={[contextMenuStyles.label, { color: textColor }]}>Изменить порядок</Text>
						</TouchableOpacity>
					)}
				</View>
			</TouchableOpacity>
		</Modal>
	);
}
