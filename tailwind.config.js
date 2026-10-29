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
          ink: '#191f28',
          soft: '#6b7684',
          green: '#3d5bd9',
          greenDark: '#2d43a6',
          mint: '#eef2ff',
          line: '#edf0f3',
          cream: '#f7f8fa',
          orange: '#3d5bd9',
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
