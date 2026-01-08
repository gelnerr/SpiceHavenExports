// accessibility.js

document.addEventListener('DOMContentLoaded', () => {
    const body = document.querySelector('body');

    // 1. Create and inject the widget HTML
    const widgetHTML = `
        <div class="accessibility-widget">
            <div class="accessibility-menu">
                <div class="language-switcher" data-lang="en">English</div>
                <div class="language-switcher" data-lang="ml">മലയാളം</div>
            </div>
            <button class="accessibility-button" aria-label="Accessibility Menu">
                <i class="fa-solid fa-universal-access"></i>
            </button>
        </div>
    `;
    body.insertAdjacentHTML('beforeend', widgetHTML);

    // 2. Get references to the new elements
    const accessibilityButton = document.querySelector('.accessibility-button');
    const accessibilityMenu = document.querySelector('.accessibility-menu');
    const languageSwitchers = document.querySelectorAll('.language-switcher');

    // 3. Add event listeners
    accessibilityButton.addEventListener('click', () => {
        accessibilityMenu.classList.toggle('active');
    });

    languageSwitchers.forEach(switcher => {
        switcher.addEventListener('click', () => {
            const selectedLang = switcher.getAttribute('data-lang');
            // Call the changeLanguage function from i18n.js
            if (typeof changeLanguage === 'function') {
                changeLanguage(selectedLang);
            }
            accessibilityMenu.classList.remove('active'); // Close menu after selection
        });
    });

    // Optional: Close menu if clicking outside of it
    document.addEventListener('click', (event) => {
        if (!accessibilityButton.contains(event.target) && !accessibilityMenu.contains(event.target)) {
            accessibilityMenu.classList.remove('active');
        }
    });
});
