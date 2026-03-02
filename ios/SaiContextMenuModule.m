#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SaiContextMenuModule, NSObject)

RCT_EXTERN_METHOD(showMenu:(NSDictionary *)options completion:(RCTResponseSenderBlock)completion)

@end
