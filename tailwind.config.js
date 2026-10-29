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
          ink: '#30231c',
          soft: '#776457',
          green: '#bd4b12',
          greenDark: '#92380e',
          mint: '#fff0e5',
          line: '#f0ded2',
          cream: '#fcf7f3',
          orange: '#bd4b12',
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
