module.exports = function (api) {
  api.cache(true)
  return {
  presets: ['babel-preset-expo'],
  plugins: [
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
    ['@babel/plugin-transform-class-properties', { loose: true }],
    ['react-native-paper/babel'],
    [
      'module-resolver',
      {
        root: ['./'],
        alias: {
          '@app': './src/app',
          '@pages': './src/pages',

          // ========= NEW ARCHITECTURE =========

          '@modules': './src/modules',

          '@auth': './src/modules/auth',
          '@chat': './src/modules/chat',
          '@notify': './src/modules/notify',
          '@post': './src/modules/post',
          '@user': './src/modules/user',
          '@onboarding': './src/modules/onboarding',
          "@comment": "./src/modules/comment",
          '@search': './src/modules/search',
          '@moderation': './src/modules/moderation',
          '@session': './src/modules/session',
          '@theme': './src/modules/theme',
          '@report': './src/modules/report',
          '@subscription': './src/modules/subscription',
          
          '@api': './src/core/api',
          '@lib': './src/core/lib',
          '@utils': './src/core/utils',
          '@storage': './src/core/storage',
          '@locales': './src/core/locales',

          '@mobx-toolbox': './src/core/mobx-toolbox',

          '@core': './src/core',
          
			    '@config': './src/core/config',
			    '@widgets': './src/core/widgets',
			    '@modals': './src/core/widgets/modals',
			    '@bottomsheets': './src/core/widgets/bottomsheets',
			    '@navigations': './src/core/widgets/navigations',
			    '@headers': './src/core/widgets/headers',
			    '@hooks': './src/core/hooks',
          '@stores': './src/core/stores',

          // ========= NEW ARCHITECTURE END =========
          
          '@images': './src/assets/images',
          '@icons': './src/assets/icons',
          '@fonts': './src/assets/fonts',
          '@sounds': './src/assets/sounds',
          '@videos': './src/assets/videos',
          '@styles': './src/assets/styles',
          '@animations': './src/assets/animations',
        },
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
      },
    ],
    [
      'module:react-native-dotenv',
      {
        moduleName: '@env',
        path: '.env',
        blacklist: null,
        whitelist: null,
        safe: false,
        allowUndefined: true,
      },
    ],
    ['babel-plugin-react-compiler', {
      target: '19'
    }],
    ['react-native-reanimated/plugin'],
  ],
  }
}