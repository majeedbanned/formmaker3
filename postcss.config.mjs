// const config = {
//   plugins: ["@tailwindcss/postcss"],
// };

// export default config;

const config = {
  plugins: {
    '@tailwindcss/postcss': {
      optimize: { minify: false },
    },
  },
};

export default config;
