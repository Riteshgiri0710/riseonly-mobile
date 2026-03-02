import React from 'react';
import { requireNativeComponent, StyleProp, ViewStyle } from 'react-native';
import { observer } from 'mobx-react-lite';
import { themeStore } from 'src/modules/theme/stores';

export interface NativeChatListViewMessage {
  id: string;
  content: string;
  isMyMessage: boolean;
  showAvatar?: boolean;
  isFirstInGroup?: boolean;
  created_at?: number;
}

type NativeChatListViewNativeProps = {
  style?: StyleProp<ViewStyle>;
  messages: NativeChatListViewMessage[];
  theme?: {
    primary_100: string;
    bg_200: string;
    text_100: string;
    secondary_100: string;
  };
  onMessagePress?: (event: { nativeEvent: { id: string; }; }) => void;
  onLoadMore?: () => void;
};

// Native name is manager class name with "Manager" suffix stripped by RCTViewManagerModuleNameForClass
const NativeChatListViewNative = requireNativeComponent<NativeChatListViewNativeProps>('NativeChatListView');

export const NativeChatListView = observer(function NativeChatListView({
  messages,
  style,
  onMessagePress,
  onLoadMore,
}: {
  messages: NativeChatListViewMessage[];
  style?: StyleProp<ViewStyle>;
  onMessagePress?: (id: string) => void;
  onLoadMore?: () => void;
}) {
  const currentTheme = themeStore.currentTheme;

  return (
    <NativeChatListViewNative
      style={[{ flex: 1 }, style]}
      messages={messages}
      theme={{
        primary_100: currentTheme.primary_100,
        bg_200: currentTheme.bg_200,
        text_100: currentTheme.text_100,
        secondary_100: currentTheme.secondary_100,
      }}
      onMessagePress={onMessagePress ? (e: any) => onMessagePress(e.nativeEvent.id) : undefined}
      onLoadMore={onLoadMore}
    />
  );
});
