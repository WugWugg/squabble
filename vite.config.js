import { sveltekit } from '@sveltejs/kit/vite';
import { resolve } from 'path';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()],
    resolve: {
      alias: {
        // NOTE: When updates happen here they should also happen in the ./tsconfig.json#compilerOptions.paths
        $components: resolve('./src/components/'),
        $lib: resolve('./src/lib/')
      }
    }
};

export default config;
