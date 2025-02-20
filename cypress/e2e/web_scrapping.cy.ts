/// <reference types="cypress" />
import { locators } from "../support/locators";

const outputDir = 'cypress/downloads';
const outputFile = `${outputDir}/companies.json`;
const logoDir = `${outputDir}/logos`;

describe('Web Scraping - Extract Multiple Companies', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    // Optionally clear session storage
    cy.window().then((win) => win.sessionStorage.clear());
  });

  it('Extracts details for first, third, and last company on each A-Z page', () => {
    // Visit the base URL
    cy.visit('/');
    cy.wait(10000);

    // Iterate through each A-Z page
    cy.get(locators.azPages).each(($page) => {
      const pageLetter = $page.text().trim(); // Extract the letter (A-Z)

      if (pageLetter) {
        cy.wrap($page).click(); // Click on the page link

        // Get all companies listed on the page
        cy.get(locators.companyLink).then(($companies) => {
          const companyIndexes = [0, 2, $companies.length - 1]; // First, third, and last company indexes

          companyIndexes.forEach((companyIndex) => {
            if (companyIndex < $companies.length) {
              cy.wrap($companies.eq(companyIndex))
                .as('selectedCompany') // Store the element before clicking
                .click({ force: true });

              // Ensure the page navigation completes before proceeding
              cy.url().should('include', '/company');


              // Extract the company name
              cy.get(locators.companyTitle)
                .invoke('text')
                .then((companyName) => {
                  const cleanedCompanyName = companyName.trim().replace(/\s+/g, '_');

                  // Extract contact information
                  cy.get(locators.companyContacts)
                    .then(($contacts) => {
                      const contactInfo = {
                        address: $contacts.eq(0).text().trim() || 'N/A',
                        fax: $contacts.eq(1).text().trim() || 'N/A',
                        medical_email: $contacts.eq(2).text().trim() || 'N/A',
                        medical_direct_line: $contacts.eq(3).text().trim() || 'N/A',
                        out_of_hours_telephone: $contacts.eq(4).text().trim() || 'N/A',
                      };

                      // Extract the company logo URL
                      cy.get(locators.companyLogo)
                        .invoke('attr', 'src')
                        .then((logoUrl) => {
                          if (!logoUrl) {
                            logoUrl = ''; // Handle missing logo URLs gracefully
                          }

                          // Convert relative URL to absolute if needed
                          if (!logoUrl.startsWith('http')) {
                            logoUrl = `https://www.medicines.org.uk${logoUrl}`;
                          }

                          const logoFilename = `${cleanedCompanyName}_logo.png`;

                          // Debugging logs
                          console.log('Final Download URL:', logoUrl);
                          console.log('Downloading:', { url: logoUrl, directory: logoDir, filename: logoFilename });

                          // Download the logo using a Cypress task
                          cy.task('downloadFile', {
                            url: logoUrl,
                            directory: logoDir,
                            filename: logoFilename,
                          }).then(() => {
                            cy.log(`Downloaded file: ${logoFilename}`);
                          });

                          // Compile company data
                          const companyData = {
                            name: cleanedCompanyName,
                            contactInfo,
                            logoFilename,
                            page: pageLetter, // Indicating from which A-Z page it came
                            companyIndex: companyIndex + 1 // 1-based index for readability
                          };

                          // Write the company data to a JSON file using a Cypress task
                          cy.task('writeJsonFile', {
                            filename: outputFile,
                            content: companyData,
                          }).then(() => {
                            cy.log(`Saved company data for: ${cleanedCompanyName}`);
                          });

                          // Navigate back to the A-Z page to pick the next company
                          cy.go('back');
                        });
                    });
                });
            }
          });

          // Navigate back to the main A-Z page
          cy.go('back');
        });
      }
    });
  });

  afterEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    // Optionally clear session storage
    cy.window().then((win) => win.sessionStorage.clear());
  });
});


