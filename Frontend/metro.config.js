const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');
 
const config = getDefaultConfig(__dirname)

const resolveRequestWithPackageExports = (context, moduleName, platform) => {
  // Package exports in `isows` (a `viem`) dependency are incompatible, so they need to be disabled
  if (moduleName === "isows") {
    const ctx = {
      ...context,
      unstable_enablePackageExports: false,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  // Package exports in `zustand@4` are incompatible, so they need to be disabled
  if (moduleName.startsWith("zustand")) {
    const ctx = {
      ...context,
      unstable_enablePackageExports: false,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  // Package exports in `ox` are incompatible, so they need to be disabled
  if (moduleName === "ox" || moduleName.startsWith("ox/")) {
    const ctx = {
      ...context,
      unstable_enablePackageExports: false,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  // Package exports in `jose` are incompatible, so the browser version is used
  if (moduleName === "jose") {
    const ctx = {
      ...context,
      unstable_conditionNames: ["browser"],
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  // Handle .js extensions in TypeScript files for ox package
  if (moduleName.endsWith('.js')) {
    const tsModule = moduleName.replace(/\.js$/, '.ts');
    try {
      return context.resolveRequest(context, tsModule, platform);
    } catch (e) {
      // If .ts doesn't work, fall through to default resolution
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.resolveRequest = resolveRequestWithPackageExports;

config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  buffer: require.resolve('buffer/'),
};

module.exports = config;

module.exports = withNativeWind(config, { input: './app/global.css' })