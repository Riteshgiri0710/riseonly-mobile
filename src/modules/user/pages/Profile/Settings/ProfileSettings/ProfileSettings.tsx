import { Box, DatePickerUi, MainText, MediaPickerUi, SimpleButtonUi, SimpleInputUi, SimpleTextAreaUi, UserLogo } from '@core/ui';
import { formatSmartDate } from '@lib/date';
import { useNavigation } from '@lib/navigation';
import { mediaInteractionsStore } from '@stores/media';
import { ProfileSettingsWrapper } from '@widgets/wrappers';
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';
import { profileActionsStore, profileServiceStore, profileStore } from 'src/modules/user/stores/profile';

export const ProfileSettings = observer(() => {
  const { currentTheme } = themeStore;
  const { editProfileAction } = profileActionsStore;
  const { onFinishUploadProfileLogo } = profileServiceStore;
  const {
    profile,
    editProfileForm: {
      values,
      errors,
      setValue
    },
    datePickerOpen: { datePickerOpen, setDatePickerOpen },
    resetForm,
    onDeleteHb
  } = profileStore;
  const {
    mediaOpen: { mediaOpen, setMediaOpen }
  } = mediaInteractionsStore;

  const { t } = useTranslation();
  const navigation = useNavigation();

  const onSelectAvatarPress = () => setMediaOpen(true);
  const onBackPress = () => navigation.goBack();
  const onSuccessPress = () => {
    editProfileAction();
    onBackPress();
  };

  if (!profile) return null;

  useEffect(() => {
    resetForm();
  }, []);

  return (
    <ProfileSettingsWrapper
      tKey='settings_profile_title'
      onBackPress={onBackPress}
      onSuccessPress={onSuccessPress}
      cancelText
      height={45}
      readyText
      transparentSafeArea
      PageHeaderUiStyle={{
        borderBottomWidth: 0
      }}
    >
      <>
        <Box style={s.avatarWrapper}>
          <UserLogo
            size={75}
            isMe
          />
          <SimpleButtonUi
            onPress={onSelectAvatarPress}
          >
            <MainText
              tac='center'
              primary
            >
              {t("select_avatar_text")}
            </MainText>
          </SimpleButtonUi>
        </Box>

        <Box style={s.inputsWrapper}>

          {/* NAME */}
          <Box style={s.inputContainer}>
            <Box style={s.groupContainer}>
              <SimpleInputUi
                style={s.input}
                placeholder={t("name_placeholder")}
                values={values}
                setValue={setValue}
                maxLength={32}
                bgColor={currentTheme.bg_200}
                name={"name"}
              />
            </Box>
            {errors.nameErr && <MainText style={s.error} color='red' px={11}>{errors.nameErr}</MainText>}
          </Box>

          {/* DESCRIPTION */}
          <Box
            style={s.groupContainer}
          >
            <SimpleTextAreaUi
              inputStyle={s.input}
              placeholder={t("description_placeholder")}
              maxHeight={100}
              maxLength={300}
              bgColor={currentTheme.bg_200}
              setText={(text) => setValue("description", text)}
              values={values}
              name="description"
              containerStyle={{ width: "100%" }}
            />
          </Box>

          {/* TAG */}
          <Box style={s.inputContainer}>
            <Box style={s.groupContainer}>
              <SimpleInputUi
                style={s.input}
                placeholder={t("tag_placeholder")}
                values={values}
                setValue={setValue}
                maxLength={32}
                bgColor={currentTheme.bg_200}
                name={"tag"}
              />
            </Box>
            {errors.tagErr && <MainText style={s.error} color='red' px={11}>{errors.tagErr}</MainText>}
          </Box>

          {/* BIRTHDAY */}
          <Box
            style={s.groupContainer}
            bgColor={currentTheme.bg_200}
            bRad={10}
          >
            <Box
              fD='column'
              gap={10}
              style={s.dateContainer}
            >
              <SimpleButtonUi
                onPress={() => setDatePickerOpen(prev => !prev)}
                height={25}
                justify='center'
              >
                <Box
                  fD='row'
                  justify='space-between'
                  align='center'
                  width={"100%"}
                >
                  <MainText>
                    {t("hb")}
                  </MainText>

                  <MainText primary>
                    {values.hb ? (
                      formatSmartDate(
                        values.hb,
                        { showYear: true, showTime: false, useRelativeTime: false }
                      )
                    ) : t("not_selected") || ''}
                  </MainText>
                </Box>
              </SimpleButtonUi>

              {datePickerOpen && (
                <Box
                  fD='column'
                  gap={15}
                >
                  <DatePickerUi
                    setOpen={setDatePickerOpen}
                    name='hb'
                    date={profile?.more.hb || (new Date().toISOString())}
                    setDate={setValue}
                    bordered
                  />

                  <SimpleButtonUi
                    onPress={onDeleteHb}
                  >
                    <MainText
                      primary
                    >
                      {t("delete_hb")}
                    </MainText>
                  </SimpleButtonUi>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {mediaOpen && (
          <MediaPickerUi
            isVisible={mediaOpen}
            onClose={() => setMediaOpen(false)}
            onSelectMedia={() => { }}
            includeEditing={true}
            onFinish={onFinishUploadProfileLogo}
          />
        )}
      </>
    </ProfileSettingsWrapper>
  );
});

const s = StyleSheet.create({
  dateContainer: {
    paddingVertical: 12.5,
    paddingHorizontal: 15,
  },
  input: {
    width: '100%',
    fontSize: 16,
    paddingVertical: 12.5,
    paddingHorizontal: 15,
    borderRadius: 10,
  },
  groupContainer: {
    width: '100%',
  },
  error: {
    position: "absolute",
    left: 5,
    bottom: -12.5
  },
  inputContainer: {
    width: "100%",
    position: "relative"
  },
  btnRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: "100%",
    height: '150%'
  },
  inputsWrapper: {
    flexDirection: 'column',
    gap: 12.5,
    marginTop: 10,
  },
  avatarWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  container: {
    paddingHorizontal: 10,
    paddingBottom: 30,
  },
  header: {
  },
  avatarImage: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
  }
});
