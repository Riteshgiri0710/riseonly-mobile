import { defaultColorValues } from '@config/const';
import TwoSamurais from '@images/BgTheme1.png';
import Afrosamurai from '@images/BgTheme2.png';
import LastSamurai from '@images/WallpaperLastSamurai.png';
import SakuraTree from '@images/WallpaperSakura.png';
import { action, makeAutoObservable, toJS } from 'mobx';
import { mobxState } from 'mobx-toolbox';
import { RgbaColor, ThemeT } from '../types';
import { changeRgbA } from '@lib/theme';

class ThemeStore {
   constructor() {
      const defaultThemeBase = {
         bg_000: "rgba(0, 0, 0, 1)",
         bg_100: "rgba(2, 2, 2, 1)",
         bg_200: "rgba(20, 20, 20, 1)",
         bg_300: "rgba(23, 23, 23, 1)",
         bg_400: "rgba(29, 29, 29, 1)",
         bg_500: "rgba(35, 35, 35, 1)",
         bg_600: "rgba(41, 41, 41, 1)",
         bg_700: "rgba(6, 6, 6, 1)",

         border_100: "1px solid rgba(37, 37, 37, 1)",
         border_200: "1px solid rgba(43, 43, 43, 1)",
         border_300: "1px solid rgba(49, 49, 49, 1)",
         border_400: "1px solid rgba(55, 55, 55, 1)",
         border_500: "1px solid rgba(61, 61, 61, 1)",
         border_600: "1px solid rgba(67, 67, 67, 1)",

         radius_100: "20px",
         radius_200: "15px",
         radius_300: "10px",
         radius_400: "30px",
         radius_500: "40px",
         radius_600: "50px",

         btn_bg_000: "rgba(0, 0, 0, 1)",
         btn_bg_100: "rgba(10, 10, 10, 1)",
         btn_bg_200: "rgba(20, 20, 20, 1)",
         btn_bg_300: "rgba(30, 30, 30, 1)",
         btn_bg_400: "rgba(40, 40, 40, 1)",
         btn_bg_500: "rgba(50, 50, 50, 1)",
         btn_bg_600: "rgba(60, 60, 60, 1)",

         btn_height_100: "55px",
         btn_height_200: "50px",
         btn_height_300: "45px",
         btn_height_400: "40px",
         btn_height_500: "35px",
         btn_height_600: "30px",

         btn_radius_000: "10px",
         btn_radius_100: "20px",
         btn_radius_200: "30px",
         btn_radius_300: "40px",

         primary_100: "rgba(255, 65, 65, 1)",
         primary_200: "rgba(255, 40, 40, 1)",
         primary_300: "rgba(255, 0, 0, 1)",

         success_100: "rgba(0, 255, 0, 1)",
         success_200: "rgba(0, 200, 0, 1)",
         success_300: "rgba(0, 150, 0, 1)",

         error_100: "rgba(255, 18, 18, 1)",
         error_200: "rgba(255, 10, 10, 1)",
         error_300: "rgba(255, 0, 0, 1)",

         text_100: "rgba(255, 255, 255, 1)",
         secondary_100: "rgba(200, 200, 200, 1)",

         input_bg_100: "rgba(25, 25, 25, 1)",
         input_bg_200: "rgba(35, 35, 35, 1)",
         input_bg_300: "rgba(45, 45, 45, 1)",
         input_border_300: "rgba(58, 58, 58, 1)",
         input_height_300: "45px",
         input_radius_300: "10px",

         mainGradientColor: {
            background: 'linear-gradient(to right, rgba(255, 65, 65, 1) 0%, rgba(255, 40, 40, 1) 50%, rgba(255, 0, 0, 1) 100%)'
         },
      };

      this.defaultTheme = this.changeToNativeThemeFormat(defaultThemeBase);

      const processedTheme = this.changeToNativeThemeFormat(defaultThemeBase);
      Object.keys(processedTheme).forEach(key => {
         (this as any)[`_${key}`] = processedTheme[key as keyof ThemeT];
      });

      this.currentBg = Afrosamurai;

      makeAutoObservable(this, {
         setBg: action,
         setMyCommentBg: action,
         setBtnsBg: action,
         setMainColor: action,
         setSecondaryColor: action,
         setBRadius: action,
         changeWallpaper: action,
         changeTheme: action,
         setBgPreview: action,
         setMyCommentBgPreview: action,
         setBtnsBgPreview: action,
         setMainColorPreview: action,
         setSecondaryColorPreview: action,
         setBRadiusPreview: action,
         setMainGradientColor: action,
         setErrorColor: action,
         currentTheme: false,
      }, { deep: false });
   }

   safeAreaWithContentHeight = mobxState(0)("safeAreaWithContentHeight");
   defaultTheme: ThemeT;
   currentThemeObj: ThemeT | undefined;
   mainBottomNavigationHeight = 45;
   groupedBtnsHeight = 52;

   getContextMenuBg = () => changeRgbA("rgba(15, 15, 15, 1)", 0.7);
   contextMenuBlurIntensity = 15;

   _bg_000 = "rgba(0, 0, 0, 1)";
   _bg_100 = "rgba(2, 2, 2, 1)";
   _bg_200 = "rgba(19, 19, 19, 1)";
   _bg_300 = "rgba(23, 23, 23, 1)";
   _bg_400 = "rgba(29, 29, 29, 1)";
   _bg_500 = "rgba(35, 35, 35, 1)";
   _bg_600 = "rgba(41, 41, 41, 1)";
   _bg_700 = "rgba(6, 6, 6, 1)";

   _border_100 = "rgba(37, 37, 37, 1)";
   _border_200 = "rgba(43, 43, 43, 1)";
   _border_300 = "rgba(49, 49, 49, 1)";
   _border_400 = "rgba(55, 55, 55, 1)";
   _border_500 = "rgba(61, 61, 61, 1)";
   _border_600 = "rgba(67, 67, 67, 1)";

   _radius_100 = 20;
   _radius_200 = 15;
   _radius_300 = 10;
   _radius_400 = 30;
   _radius_500 = 40;
   _radius_600 = 50;

   _btn_bg_000 = "rgba(0, 0, 0, 1)";
   _btn_bg_100 = "rgba(10, 10, 10, 1)";
   _btn_bg_200 = "rgba(20, 20, 20, 1)";
   _btn_bg_300 = "rgba(30, 30, 30, 1)";
   _btn_bg_400 = "rgba(40, 40, 40, 1)";
   _btn_bg_500 = "rgba(50, 50, 50, 1)";
   _btn_bg_600 = "rgba(60, 60, 60, 1)";

   _btn_height_100 = 55;
   _btn_height_200 = 50;
   _btn_height_300 = 45;
   _btn_height_400 = 40;
   _btn_height_500 = 35;
   _btn_height_600 = 30;

   _btn_radius_000 = 10;
   _btn_radius_100 = 20;
   _btn_radius_200 = 30;
   _btn_radius_300 = 40;

   _primary_100 = "rgba(255, 65, 65, 1)";
   _primary_200 = "rgba(255, 40, 40, 1)";
   _primary_300 = "rgba(255, 0, 0, 1)";

   _success_100 = "rgba(0, 255, 0, 1)";
   _success_200 = "rgba(0, 200, 0, 1)";
   _success_300 = "rgba(0, 150, 0, 1)";

   _error_100 = "rgba(255, 18, 18, 1)";
   _error_200 = "rgba(255, 10, 10, 1)";
   _error_300 = "rgba(255, 0, 0, 1)";

   _text_100 = "rgba(255, 255, 255, 1)";
   _secondary_100 = "rgba(200, 200, 200, 1)";

   _input_bg_100 = "rgba(25, 25, 25, 1)";
   _input_bg_200 = "rgba(35, 35, 35, 1)";
   _input_bg_300 = "rgba(45, 45, 45, 1)";
   _input_border_300 = "rgba(58, 58, 58, 1)";
   _input_height_300 = 45;
   _input_radius_300 = 10;

   _mainGradientColor = {
      background: 'linear-gradient(to right, rgba(255, 65, 65, 1) 0%, rgba(255, 40, 40, 1) 50%, rgba(255, 0, 0, 1) 100%)'
   };

   get currentTheme(): ThemeT {
      return {
         bg_000: this._bg_000,
         bg_100: this._bg_100,
         bg_200: this._bg_200,
         bg_300: this._bg_300,
         bg_400: this._bg_400,
         bg_500: this._bg_500,
         bg_600: this._bg_600,
         bg_700: this._bg_700,
         border_100: this._border_100,
         border_200: this._border_200,
         border_300: this._border_300,
         border_400: this._border_400,
         border_500: this._border_500,
         border_600: this._border_600,
         radius_100: this._radius_100,
         radius_200: this._radius_200,
         radius_300: this._radius_300,
         radius_400: this._radius_400,
         radius_500: this._radius_500,
         radius_600: this._radius_600,
         btn_bg_000: this._btn_bg_000,
         btn_bg_100: this._btn_bg_100,
         btn_bg_200: this._btn_bg_200,
         btn_bg_300: this._btn_bg_300,
         btn_bg_400: this._btn_bg_400,
         btn_bg_500: this._btn_bg_500,
         btn_bg_600: this._btn_bg_600,
         btn_height_100: this._btn_height_100,
         btn_height_200: this._btn_height_200,
         btn_height_300: this._btn_height_300,
         btn_height_400: this._btn_height_400,
         btn_height_500: this._btn_height_500,
         btn_height_600: this._btn_height_600,
         btn_radius_000: this._btn_radius_000,
         btn_radius_100: this._btn_radius_100,
         btn_radius_200: this._btn_radius_200,
         btn_radius_300: this._btn_radius_300,
         primary_100: this._primary_100,
         primary_200: this._primary_200,
         primary_300: this._primary_300,
         success_100: this._success_100,
         success_200: this._success_200,
         success_300: this._success_300,
         error_100: this._error_100,
         error_200: this._error_200,
         error_300: this._error_300,
         text_100: this._text_100,
         secondary_100: this._secondary_100,
         input_bg_100: this._input_bg_100,
         input_bg_200: this._input_bg_200,
         input_bg_300: this._input_bg_300,
         input_border_300: this._input_border_300,
         input_height_300: this._input_height_300,
         input_radius_300: this._input_radius_300,
         mainGradientColor: this._mainGradientColor,
      };
   }

   wallpapersList = [
      { title: 'Афросамурай', isPremium: false, image: Afrosamurai },
      { title: 'Самурай воин', isPremium: false, image: TwoSamurais },
      { title: 'Последний самурай', isPremium: true, image: LastSamurai },
      { title: 'Цветение сакуры', isPremium: true, image: SakuraTree },
   ];
   currentBg: string;

   getBlurViewBgColor = () => {
      return this._bg_100;
   };

   changeToNativeThemeFormat = (theme: ThemeT) => {
      const processThemeObject = (obj: any) => {
         const newObj = { ...obj };

         if (newObj.border) {
            console.log(newObj.border);
            const borderParts = newObj.border.split(' ');
            const borderColor = borderParts.slice(2).join(" ");

            if (borderParts[0]) {
               newObj.borderWidth = Number(borderParts[0].replace('px', ''));
            }

            // rgba(83, 83, 83, 1)
            if (borderColor) newObj.borderColor = borderColor;

            delete newObj.border;
         }

         Object.keys(newObj).forEach(key => {
            if (key === 'height' || key === 'borderRadius') {
               if (typeof newObj[key] === 'string' && newObj[key].includes('px')) {
                  newObj[key] = Number(newObj[key].replace('px', ''));
               }
            }
         });

         Object.keys(newObj).forEach(key => {
            if (typeof newObj[key] === 'object' && newObj[key] !== null) {
               newObj[key] = processThemeObject(newObj[key]);
            }
         });

         return newObj;
      };

      return processThemeObject({ ...theme });
   };

   setBorderColor = (e: RgbaColor) => {
   };

   setErrorColor = (e: RgbaColor) => {
   };

   setMainGradientColor = (e: RgbaColor) => {
   };

   setBg = (e: RgbaColor) => {
   };

   setMyCommentBg = (e: RgbaColor) => {
   };

   setBtnsBg = (e: RgbaColor) => {
   };

   setMainColor = (e: RgbaColor) => {
   };

   setSecondaryColor = (e: RgbaColor) => {
   };

   setBRadius = (radius: string) => {
      if (radius.length > 3) return;
   };

   changeWallpaper = (url: string) => {
      this.currentBg = url;
      document.body.style.backgroundImage = `url(${url})`;
   };

   changeTheme = (colors: ThemeT) => {
      colors = toJS(colors);
      Object.keys(colors).forEach(key => {
         const fieldKey = `_${key}` as keyof this;
         if (fieldKey in this) {
            (this as any)[fieldKey] = colors[key as keyof ThemeT];
         }
      });
   };

   // PREVIEW MODE EDITING THEME

   setBgPreview = (e: RgbaColor) => {
      if (!this.currentThemeObj) return;
   };

   setMyCommentBgPreview = (e: RgbaColor) => {
      if (!this.currentThemeObj) return;
   };

   setBtnsBgPreview = (e: RgbaColor) => {
      if (!this.currentThemeObj) return;
   };

   setMainColorPreview = (e: RgbaColor) => {
      if (!this.currentThemeObj) return;
   };

   setSecondaryColorPreview = (e: RgbaColor) => {
      if (!this.currentThemeObj) return;
   };

   setBRadiusPreview = (radius: string) => {
      if (!this.currentThemeObj) return;
      if (radius.length > 3) return;
   };

   setThemeValue = (key: keyof ThemeT, value: any) => {
      const fieldKey = `_${key}` as keyof this;
      if (fieldKey in this) {
         (this as any)[fieldKey] = value;
      }
   };

   changeSomeColor = (e: string) => {
      const rightRgba = e.replace('rgba(', '').replace(')', '').split(',');
      const rgba: RgbaColor = {
         r: Number(rightRgba[0]),
         g: Number(rightRgba[1]),
         b: Number(rightRgba[2]),
         a: Number(rightRgba[3])
      };

      const colorValue = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
      const { selectedRoute: { selectedRoute } } = this;

      const routeKeyMap: Record<string, keyof ThemeT> = {
         'BgColorSettings': 'bg_200',
         'BtnColorSettings': 'btn_bg_300',
         'TextColorSettings': 'text_100',
         'SecondaryTextColorSettings': 'secondary_100',
         'ErrorColorSettings': 'error_100',
         'PrimaryColorSettings': 'primary_100',
         'BorderColorSettings': 'border_100',
         'InputBgSettings': 'input_bg_300',
         'RadiusSettings': 'radius_100',
         'BtnHeightSettings': 'btn_height_300',
         'BtnRadiusSettings': 'btn_radius_200',
         'InputHeightSettings': 'input_height_300',
         'InputRadiusSettings': 'input_radius_300',
      };

      const themeKey = routeKeyMap[selectedRoute];
      if (themeKey) {
         this.setThemeValue(themeKey, colorValue);
      }
   };

   setCurrentTheme = (theme: ThemeT) => {
      Object.keys(theme).forEach(key => {
         const fieldKey = `_${key}` as keyof this;
         if (fieldKey in this) {
            (this as any)[fieldKey] = theme[key as keyof ThemeT];
         }
      });
   };
   setCurrentThemeObj = (theme: ThemeT) => this.currentThemeObj = toJS(theme);

   colorBottomSheet = mobxState(false)("colorBottomSheet");
   selectedRoute = mobxState('')("selectedRoute");

   changeToDefault = () => {
      const { selectedRoute: { selectedRoute } } = this;

      const obj = {
         "BgColorSettings": "bg_200",
         "BtnColorSettings": "btn_bg_300",
         "TextColorSettings": "text_100",
         "SecondaryTextColorSettings": "secondary_100",
         "PrimaryColorSettings": "primary_100"
      };

      const path = obj[selectedRoute as keyof typeof obj];
      if (!path) return;

      const parent = path.split('.')[0];
      if (parent) {
         const defaultValue = defaultColorValues[selectedRoute as keyof typeof defaultColorValues];
         const fieldKey = `_${parent}` as keyof this;
         if (fieldKey in this) {
            (this as any)[fieldKey] = defaultValue;
         }
      }
   };
}

export const themeStore = new ThemeStore;
