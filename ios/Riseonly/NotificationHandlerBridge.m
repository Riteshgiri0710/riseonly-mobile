//
//  NotificationHandlerBridge.m
//  Riseonly
//
//  RCTEventEmitter sendEventWithName:body: can throw (e.g. when body triggers
//  NSMutableDictionary initWithContentsOfFile / plist assertion inside RN).
//  This wrapper catches the exception so the app does not crash.
//

#import "NotificationHandlerBridge.h"
#import <React/RCTEventEmitter.h>

@implementation NotificationHandlerBridge

+ (void)sendEventWithName:(NSString *)name
                     body:(NSDictionary *)body
                  emitter:(RCTEventEmitter *)emitter
{
    NSDictionary *safeBody = (body != nil) ? body : @{};
    @try {
        [emitter sendEventWithName:name body:safeBody];
    } @catch (NSException *exception) {
        NSLog(@"NotificationHandlerBridge: sendEventWithName '%@' failed: %@", name, exception);
    }
}

@end
