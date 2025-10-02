// export default { 
//   plugins: { 
//     tailwindcss: {}, 
//     autoprefixer: {}, 
//   }, 
// } 
export default {
  plugins: {
    '@tailwindcss/postcss': {}, // <-- 使用新的插件包
    autoprefixer: {},
  },
}
// export default {
//   plugins: [
//     require('@tailwindcss/postcss'),
//     require('autoprefixer')
//   ]
// }