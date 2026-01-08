// accessibility.js

document.addEventListener('DOMContentLoaded', () => {
    const body = document.querySelector('body');

    // 1. Create and inject the widget HTML with a nested menu structure
    const widgetHTML = `
        <div class="accessibility-widget">
            <div class="accessibility-menu">
                <div class="menu-item" id="languages-menu-item">
                    <span>Languages</span>
                    <i class="fa-solid fa-chevron-right"></i>
                    <div class="sub-menu">
                        <div class="sub-menu-item" data-lang="en">English</div>
                        <div class="sub-menu-item" data-lang="ml">മലയാളം</div>
                    </div>
                </div>
                <!-- Other accessibility features can be added here as new .menu-item divs -->
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
    const languagesMenuItem = document.getElementById('languages-menu-item');
    const languageSubMenu = languagesMenuItem.querySelector('.sub-menu');
    const languageSwitchers = document.querySelectorAll('.sub-menu-item');

    // 3. Add event listeners
    accessibilityButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent this click from being caught by the document listener
        accessibilityMenu.classList.toggle('active');
    });

    languagesMenuItem.addEventListener('mouseenter', () => {
        languagesMenuItem.classList.add('show-sub-menu');
    });
    
    languagesMenuItem.addEventListener('mouseleave', () => {
        languagesMenuItem.classList.remove('show-sub-menu');
    });

    languageSwitchers.forEach(switcher => {
        switcher.addEventListener('click', (event) => {
            event.stopPropagation(); // Stop the click from closing the main menu immediately
            const selectedLang = switcher.getAttribute('data-lang');
            if (typeof changeLanguage === 'function') {
                changeLanguage(selectedLang);
            }
            accessibilityMenu.classList.remove('active');
            languagesMenuItem.classList.remove('show-sub-menu');
        });
    });

    // Close all menus if clicking outside
    document.addEventListener('click', (event) => {
        if (!accessibilityButton.contains(event.target) && !accessibilityMenu.contains(event.target)) {
            accessibilityMenu.classList.remove('active');
            languagesMenuItem.classList.remove('show-sub-menu');
        }
    });
});
