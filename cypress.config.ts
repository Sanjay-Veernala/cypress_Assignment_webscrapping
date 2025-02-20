import { defineConfig } from 'cypress';
import { downloadFile } from 'cypress-downloadfile/lib/addPlugin';
import * as fs from 'fs';

export default defineConfig({
  e2e: {
    chromeWebSecurity: false,
    setupNodeEvents(on, config) {
      on('task', {
        downloadFile({ url, directory, filename }) {
          return downloadFile({
            url,
            directory,
            fileName: filename,
            cookies: [] // Ensure cookies exist to avoid `.map()` errors
          });
        },
        ensureDirectoryExists(dir: string) {
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          return null;
        },
        writeJsonFile({ filename, content }: { filename: string; content: any }) {
          let data: any[] = [];
          if (fs.existsSync(filename)) {
            data = JSON.parse(fs.readFileSync(filename, 'utf8'));
          }
          data.push(content);
          fs.writeFileSync(filename, JSON.stringify(data, null, 2));
          return null;
        }
      });

      return config;
    },
    baseUrl: 'https://www.medicines.org.uk/emc/browse-companies',
    specPattern: 'cypress/e2e/**/*.cy.ts'
  }
});
