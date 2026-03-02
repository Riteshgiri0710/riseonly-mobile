import { TextAlignT } from '@ui/types';
import { observer } from 'mobx-react-lite';
import { DimensionValue, Text, TextProps } from 'react-native';
import { themeStore } from 'src/modules/theme/stores';

interface MainTextProps extends TextProps {
   px?: number;
   tac?: TextAlignT;
   marginTop?: number;
   fontWeight?: string;
   color?: string;
   mR?: number;
   primary?: boolean;
   secondary?: boolean;
   width?: DimensionValue;
   numberOfLines?: number;
   mL?: number;
   mB?: number;
   debug?: boolean;
}

export const MainText = observer(({
   style,
   px = 16,
   tac = 'auto',
   marginTop = 0,
   mR = 0,
   mL = 0,
   mB = 0,
   numberOfLines = 0,
   width = "auto",
   debug = false,
   color,
   fontWeight = 'normal',
   primary = false,
   secondary = false,
   ...props
}: MainTextProps) => {
   const { currentTheme } = themeStore;

   if (primary) color = currentTheme.primary_100;
   if (secondary) color = currentTheme.secondary_100;

   return (
      <Text
         numberOfLines={numberOfLines}
         ellipsizeMode="tail"
         style={[
            debug && {
               borderWidth: 0.2,
               borderColor: "red"
            },
            {
               fontSize: px,
               color: color || currentTheme.text_100,
               textAlign: tac,
               marginTop,
               marginRight: mR,
               marginLeft: mL,
               marginBottom: mB,
               fontWeight: fontWeight as any,
               width,
            },
            style
         ]}
         {...props}
      />
   );
});