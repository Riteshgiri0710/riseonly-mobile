import { BottomSheetUi, GroupedBtns, SecondaryText } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { StyleSheet } from 'react-native';
import { commentInteractionsStore } from 'src/modules/comment/stores';
import { moderationStore } from 'src/modules/moderation/stores';
import { getReportsBtns } from 'src/modules/report/shared/config/grouped-btns-data';

export const ReportsSheet = observer(() => {
   const { repliesOpen: { repliesOpen }, } = commentInteractionsStore;
   const { isReportOpen: { setIsReportOpen, isReportOpen } } = moderationStore;

   const reportsBtns = getReportsBtns();

   return (
      <>
         {isReportOpen && (
            <BottomSheetUi
               isBottomSheet={isReportOpen}
               setIsBottomSheet={setIsReportOpen}
               title={'Пожаловаться на'}
               bottomSheetViewStyle={{ paddingBottom: 100 }}
               leftBtn={repliesOpen}
               leftBtnPress={() => { }}
            >
               {/* TODO: ПОМЕНЯТЬ НА ДИНАМИЧЕСКУЮ ИНФУ ВМЕСТО ПОСТА, СООБЩЕНИЕ К ПРИМЕРУ */}
               <SecondaryText ml={30} mt={35} px={13}>ЧТО НЕ ТАК С ЭТИМ ПОСТОМ?</SecondaryText>

               <GroupedBtns
                  // @ts-ignore
                  wrapperStyle={{ padding: 15 }}
                  items={reportsBtns}
               />
            </BottomSheetUi>
         )}
      </>
   );
});

const s = StyleSheet.create({
   text: {
      paddingBottom: 15
   }
});