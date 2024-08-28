#!/bin/bash

# Vytvoření hlavní struktury
mkdir -p src/{components,hooks,utils,contexts,config,styles,__tests__/integration}

# Vytvoření __tests__ adresářů pro hooks a utils
mkdir -p src/hooks/__tests__ src/utils/__tests__

# Komponenty
for component in ChatWidget Message CartItem CartSummary ChatInput CartHeader; do
    mkdir -p src/components/$component/__tests__
    touch src/components/$component/$component.jsx
    touch src/components/$component/$component.module.css
    touch src/components/$component/__tests__/$component.test.jsx
    [ "$component" = "ChatWidget" ] && {
        touch src/components/$component/{ChatDesktop.jsx,ChatMobile.jsx,useChatWidget.js,README.md}
        touch src/components/$component/__tests__/{ChatDesktop.test.jsx,ChatMobile.test.jsx}
    }
done

# Hooks
for hook in useChatState useCartState useSpeechRecognition useResponsive; do
    touch src/hooks/$hook.js
    touch src/hooks/__tests__/$hook.test.js
done

# Utils
mkdir -p src/utils/api
touch src/utils/api/{chat.js,cart.js}
touch src/utils/helpers.js
touch src/utils/__tests__/helpers.test.js

# Contexts
touch src/contexts/{ChatContext.js,CartContext.js}

# Config
touch src/config/constants.js

# Styles
touch src/styles/global.css

# Tests
touch src/__tests__/integration/ChatWidget.test.jsx

# Root files
touch src/{index.jsx,App.jsx,README.md}

echo "Project structure created successfully!"