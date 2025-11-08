import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
// import replace from 'vite-plugin-filter-replace'

export default defineConfig({
  plugins: [
    // replace(
    //   [
    //     {
    //       // TODO: it's done to fix bug with combination of @nestjs/swagger, class-transformer and Vite (https://stackoverflow.com/questions/70802610/module-not-found-error-cant-resolve-class-transformer-storage-angular-uni)
    //       filter: /\.tsx?$/,
    //       replace: {
    //         from: /from '@nestjs\/swagger'/g,
    //         to: "from '@nestjs-fake'"
    //       }
    //     },
    //     {
    //       filter: /\@nestjs\/mapped\-types\/dist\/type\-helpers\.utils\.js$/,
    //       replace: {
    //         from: /class\-transformer\/storage/g,
    //         to: 'class-transformer/cjs/storage'
    //       }
    //     }
    //   ],
    //   {
    //     enforce: 'pre'
    //   }
    // ),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths()
  ]
})
