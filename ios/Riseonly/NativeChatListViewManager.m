#import <React/RCTViewManager.h>

@interface RCT_EXTERN_REMAP_MODULE(NativeChatListViewManager, NativeChatListViewManager, RCTViewManager)

RCT_EXPORT_VIEW_PROPERTY(messages, NSArray)
RCT_EXPORT_VIEW_PROPERTY(theme, NSDictionary)
RCT_EXPORT_VIEW_PROPERTY(onMessagePress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onLoadMore, RCTDirectEventBlock)

@end
