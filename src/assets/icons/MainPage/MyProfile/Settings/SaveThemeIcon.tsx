import { IconOnlyWithSize } from '@/shared/utils/globalTypes'

export const SaveThemeIcon = ({ size = 32 }: IconOnlyWithSize) => {
   return (
      <svg width={size} height={size} viewBox="0 0 31 32" fill="none" xmlns="http://www.w3.org/2000/svg">
         <path d="M12 10.25C14.5859 10.25 17.0658 11.2772 18.8943 13.1057C20.7228 14.9342 21.75 17.4141 21.75 20C21.75 22.5859 20.7228 25.0658 18.8943 26.8943C17.0658 28.7228 14.5859 29.75 12 29.75V10.25ZM12 8C8.8174 8 5.76516 9.26428 3.51472 11.5147C1.26428 13.7652 0 16.8174 0 20C0 23.1826 1.26428 26.2348 3.51472 28.4853C5.76516 30.7357 8.8174 32 12 32C15.1826 32 18.2348 30.7357 20.4853 28.4853C22.7357 26.2348 24 23.1826 24 20C24 16.8174 22.7357 13.7652 20.4853 11.5147C18.2348 9.26428 15.1826 8 12 8Z" fill="#BABABA" />
         <rect x="14" width="17" height="16.1053" rx="8.05263" fill="url(#paint0_linear_957_3962)" />
         <rect x="14" width="17" height="16.1053" rx="8.05263" fill="black" fillOpacity="0.26" />
         <g filter="url(#filter0_d_957_3962)">
            <path d="M19 10L18 4.5L20.75 7L22.5 4L24.25 7L27 4.5L26 10H19ZM26 11.5C26 11.8 25.8 12 25.5 12H19.5C19.2 12 19 11.8 19 11.5V11H26V11.5Z" fill="url(#paint1_linear_957_3962)" />
         </g>
         <defs>
            <filter id="filter0_d_957_3962" x="14" y="0" width="17" height="16" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
               <feFlood floodOpacity="0" result="BackgroundImageFix" />
               <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
               <feOffset />
               <feGaussianBlur stdDeviation="2" />
               <feComposite in2="hardAlpha" operator="out" />
               <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.43 0" />
               <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_957_3962" />
               <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_957_3962" result="shape" />
            </filter>
            <linearGradient id="paint0_linear_957_3962" x1="14.5" y1="7" x2="26.2137" y2="2.581" gradientUnits="userSpaceOnUse">
               <stop offset="0.005" stopColor="#FF7C03" />
               <stop offset="0.547821" stopColor="#FF0099" />
               <stop offset="1" stopColor="#BD00FF" />
            </linearGradient>
            <linearGradient id="paint1_linear_957_3962" x1="18.45" y1="1.73333" x2="27.5993" y2="2.13412" gradientUnits="userSpaceOnUse">
               <stop offset="0.005" stopColor="#FF7C03" />
               <stop offset="0.5025" stopColor="#FF54BA" />
               <stop offset="1" stopColor="#EAADFF" />
            </linearGradient>
         </defs>
      </svg>

   )
}