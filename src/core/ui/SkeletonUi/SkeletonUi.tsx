import { observer } from 'mobx-react-lite';
import { themeStore } from 'src/modules/theme/stores';

interface SkeletonUiProps {
  children: React.ReactNode;
}

export const SkeletonUi = observer(({
  children
}: SkeletonUiProps) => {
  const { currentTheme } = themeStore;

  return (
    <></>
  );
});
