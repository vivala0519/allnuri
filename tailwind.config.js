/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        onnuri: {
          ink: '#172b29',
          soft: '#66716e',
          green: '#18795f',
          greenDark: '#0e604c',
          mint: '#e2f4e9',
          line: '#e4eae5',
          cream: '#f7f8f5',
          orange: '#ff7a52',
        }
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '"Noto Sans KR"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Apple SD Gothic Neo"',
          '"Malgun Gothic"',
          'sans-serif',
        ],
      },
      borderRadius: {
        'card': '20px',
        'panel': '26px',
      }
    },
  },
  plugins: [],
};
