import BottomSheet from '@gorhom/bottom-sheet';
import { localStorage } from '@storage/index';
import { makeAutoObservable } from 'mobx';
import { mobxState, useMobxForm } from 'mobx-toolbox';
import { ModerationsSchema } from 'src/modules/moderation/shared/schemas/moderationSchema';
import { moderationActionsStore } from '../moderation-actions/moderation-actions';
import { ModerationRequestResponse } from '../moderation-actions/types';

class ModerationStore {
   constructor() { makeAutoObservable(this); }

   isReportOpen = mobxState(false)("isReportOpen");
   bottomSheetRef: React.RefObject<BottomSheet> | null = null;
   commentsBottomSheetCloseSignal = mobxState(false)("commentsBottomSheetCloseSignal");
   setBottomSheetRef = (ref: React.RefObject<BottomSheet>) => this.bottomSheetRef = ref;

   // MODERATION REQUEST

   callingCode = mobxState('')('callingCode', { reset: true });

   submitModerationForm = useMobxForm({
      full_name: "",
      nationality: "",
      phone: "",
      city: "",
      reason: "",
   }, ModerationsSchema, {
      disabled: true,
      instaValidate: true,
      resetErrIfNoValue: false,
   });

   // MODERATION REASON MODAL

   isModerationReasonModalOpen = mobxState(false)('isModerationReasonModalOpen');

   // MY MODERATION REQUEST PRELOAD

   preloadMyModerationRequest = async () => {
      const { getMyModerationRequestAction } = moderationActionsStore;

      const request: ModerationRequestResponse | null = await localStorage.get("moderation-request");

      if (request) {
         getMyModerationRequestAction(false, request);
         return;
      }

      getMyModerationRequestAction();
   };

   // BOTTOM SHEET

   closeBottomSheet = () => {
      console.log('Trying to close bottom sheet', this.bottomSheetRef?.current);
      if (this.bottomSheetRef?.current) {
         try {
            this.bottomSheetRef.current.close();
            console.log('Bottom sheet close method called');
         } catch (error) {
            console.error('Error closing bottom sheet:', error);
         }
      } else {
         console.log('Bottom sheet ref is null');
      }

      this.isReportOpen.setIsReportOpen(false);
   };
}

export const moderationStore = new ModerationStore();