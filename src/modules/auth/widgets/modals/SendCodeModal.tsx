import { Box, CustomModalUi, LoaderUi, MainText, SecondaryText } from '@core/ui';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { CodeField, useBlurOnFulfill, useClearByFocusCell } from 'react-native-confirmation-code-field';
import { Portal } from 'react-native-paper';
import { authActionsStore, authStore } from 'src/modules/auth/stores';
import { themeStore } from 'src/modules/theme/stores';

const CELL_COUNT = 4;

export const SendCodeModal = observer(() => {
  const { currentTheme } = themeStore;
  const {
    registerSai: { status }
  } = authActionsStore;
  const {
    code: { code, setCode },
    isCodeOpen: { isCodeOpen, setIsCodeOpen },
    isLinkingBot: { setIsLinkingBot }
  } = authStore;

  const { t } = useTranslation();
  const ref = useBlurOnFulfill({ value: code, cellCount: CELL_COUNT });
  const [props] = useClearByFocusCell({
    value: code,
    setValue: setCode,
  });

  useEffect(() => {
    if (!ref.current || !isCodeOpen) return;
    ref.current.focus();
  }, [isCodeOpen]);

  if (status === 'fulfilled') return null;

  return (
    <Portal>
      <CustomModalUi
        visible={isCodeOpen}
        setVisible={setIsCodeOpen}
        onClose={() => {
          authActionsStore.sendCodeSai.status = "rejected";
          setIsLinkingBot(false);
        }}
        width={250}
        height={150}
      >
        {status == 'pending' ? (
          <Box centered width={"100%"} flex={1}>
            <LoaderUi />
          </Box>
        ) : (
          <>
            <Box centered width={"100%"} flex={1}>
              <MainText>{t('send_code')}</MainText>
            </Box>

            <View
              style={{
                paddingHorizontal: 15,
                flexDirection: "row",
                gap: 10,
              }}
            >
              <CodeField
                {...props}
                ref={ref}
                value={code}
                onChangeText={e => setCode(e)}
                cellCount={CELL_COUNT}
                rootStyle={{}}
                keyboardType="number-pad"
                renderCell={({ index, symbol, isFocused }) => (
                  <View
                    key={index}
                    style={{
                      width: 30,
                      height: 36,
                      marginHorizontal: 3,
                      borderWidth: 1,
                      borderRadius: 7,
                      borderColor: isFocused ? currentTheme.primary_100 : currentTheme.secondary_100,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <MainText>{symbol}</MainText>
                  </View>
                )}
              />
            </View>

            <Box>
              <SecondaryText px={11} tac='center' >
                {t('send_code_subtitle')}
              </SecondaryText>
            </Box>
          </>
        )}
      </CustomModalUi>
    </Portal>
  );
});