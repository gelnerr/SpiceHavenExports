// i18n.js

// This function initializes i18next and sets up the language change logic.
async function initializeI18next() {
    await i18next
        .use(i18nextHttpBackend)
        .init({
            lng: 'en', // default language
            fallbackLng: 'en',
            debug: true, // Set to false in production
            backend: {
                loadPath: '/locales/{{lng}}.json', // Path to your translation files
            },
        });
    
    // This function will be called to update the text on the page
    updateContent();
}

// This function finds all elements with a data-i18n attribute and updates their content
function updateContent() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.innerHTML = i18next.t(key);
    });
}

// This function changes the language and updates the content
async function changeLanguage(lng) {
    await i18next.changeLanguage(lng);
    updateContent();
}

// Initialize the library when the script loads
initializeI18next();
