//
//  NotificationHandlerBridge.h
//  Riseonly
//
//  Safe wrapper for RCTEventEmitter sendEventWithName:body: (catches Obj-C exceptions).
//

#import <Foundation/Foundation.h>

@class RCTEventEmitter;

NS_ASSUME_NONNULL_BEGIN

@interface NotificationHandlerBridge : NSObject

+ (void)sendEventWithName:(NSString *)name
                     body:(NSDictionary *)body
                  emitter:(RCTEventEmitter *)emitter;

@end

NS_ASSUME_NONNULL_END
