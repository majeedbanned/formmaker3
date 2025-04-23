import localFont from 'next/font/local';

export const vazirmatn = localFont({
  src: '../fonts/Vazirmatn-Regular.ttf',
});

export const vazir = localFont({
  src: [
    {
      path: '../fonts/Vazir-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Vazir-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/Vazir-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-vazir',
}); 