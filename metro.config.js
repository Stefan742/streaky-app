// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// 🔥 ИСПРАВЕНО: extend постоечката конфигурација
config.transformer = {
  ...config.transformer, // 🔥 Зачувај ги постоечките трансформери
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...config.resolver, // 🔥 Зачувај ги постоечките resolver опции
  assetExts: config.resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'], // 🔥 Додај svg
};

module.exports = config;