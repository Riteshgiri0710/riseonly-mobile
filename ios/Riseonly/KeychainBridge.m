//
//  KeychainBridge.m
//  Riseonly
//
//  React Native bridge for KeychainHelper
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(KeychainBridge, NSObject)

RCT_EXTERN_METHOD(saveAuthToken:(NSString *)token
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getAuthToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(deleteAuthToken:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end

