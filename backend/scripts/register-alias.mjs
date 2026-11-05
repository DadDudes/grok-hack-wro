import { registerHooks } from 'node:module';

const backendRoot = new URL('../', import.meta.url);

/**
 * Lets `node --experimental-strip-types` load the app's extensionless `@/` imports.
 * Next.js resolves those itself. This file is only for tests and the exercise script.
 */
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@grok-hack/api-contract') {
      return nextResolve(
        new URL('./vendor/api-contract/src/index.ts', backendRoot).href,
        context,
      );
    }
    if (specifier.startsWith('@/')) {
      return nextResolve(new URL(`${specifier.slice(2)}.ts`, backendRoot).href, context);
    }
    const parent = context.parentURL ?? '';
    const ourSource = parent.includes('/backend/') && !parent.includes('/node_modules/');
    if (
      ourSource &&
      (specifier.startsWith('./') || specifier.startsWith('../')) &&
      !/\.[cm]?[jt]s$/.test(specifier)
    ) {
      const parent = new URL(context.parentURL);
      return nextResolve(new URL(`${specifier}.ts`, parent).href, context);
    }
    return nextResolve(specifier, context);
  },
});
