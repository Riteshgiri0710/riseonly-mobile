import { IconWithSize } from '@/shared/utils/globalTypes'

export const SecondaryTextColor = ({ size = 18, color = "white" }: IconWithSize) => {
   return (
      <svg width={size} height={size} viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
         <path d="M3.927 9.25H3.58072L3.45894 9.57416L2.45372 12.25H2.12781L6.6435 0.5H7.3565L11.8722 12.25H11.5433L10.5116 9.57035L10.3883 9.25H10.045H3.927ZM4.03417 8.07093L3.77368 8.75H4.501H9.478H10.2031L9.94535 8.07229L7.55835 1.79479L7.4358 1.4725H7.091H6.909H6.56527L6.44217 1.79343L4.03417 8.07093ZM0.5 15.5H13.5V17.5H0.5V15.5Z" stroke={color} />
      </svg>
   )
}