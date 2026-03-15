## Project Overview

The project is a static multi-page website built using Vanilla HTML, CSS, and JavaScript. The goal is to create a simple application prototype with 4-6 separate HTML pages, shared navigation, and rich interactive content.

## Technical Requirements

* Stack: Vanilla HTML, CSS, JavaScript ONLY
* File Structure: Organized with pages/, components/, styles/, scripts/, data/ directories
* Shared navigation and footer components
* CSS custom properties for theming
* Interactive JavaScript features (tabs, modals, search/filter, forms with validation, sortable tables)

## File Structure

```markdown
- index.html
- pages/
  - dashboard.html
  - details.html
  - settings.html
  - about.html
- components/
  - nav.html
  - footer.html
  - tabs.html
  - modals.html
- styles/
  - global.css
  - theme.css
- scripts/
  - main.js
  - tabs.js
  - modals.js
- data/
  - dummy-data.json
```

## Page Content

### Index.html

* Header with navigation
* Hero section with a call-to-action button
* Featured section with 3-4 cards
* Footer

### Dashboard.html

* Header with navigation
* Dashboard overview with 3-4 widgets
* Interactive table with sorting and filtering
* Footer

### Details.html

* Header with navigation
* Detailed view of a single item
* Interactive tabs with content
* Footer

### Settings.html

* Header with navigation
* Settings form with validation
* Footer

### About.html

* Header with navigation
* About page content
* Footer

## Component Structure

* **nav.html**: Shared navigation component with links to all pages
* **footer.html**: Shared footer component with copyright information
* **tabs.html**: Interactive tabs component with JavaScript functionality
* **modals.html**: Interactive modals component with JavaScript functionality

## CSS Layout Strategy

* **global.css**: Global styles for the application
* **theme.css**: Custom properties for theming

## JavaScript Features

* **main.js**: Main JavaScript file for the application
* **tabs.js**: JavaScript file for tabs component
* **modals.js**: JavaScript file for modals component

## Data Structures

* **dummy-data.json**: Dummy data for the application

## FORGE EXECUTION CONTRACT

### File List

1. index.html
2. pages/dashboard.html
3. pages/details.html
4. pages/settings.html
5. pages/about.html
6. components/nav.html
7. components/footer.html
8. components/tabs.html
9. components/modals.html
10. styles/global.css
11. styles/theme.css
12. scripts/main.js
13. scripts/tabs.js
14. scripts/modals.js
15. data/dummy-data.json

### Architecture

The application will have a multi-page architecture with 4-6 separate HTML pages. Each page will have a shared navigation and footer component. The application will use CSS custom properties for theming and interactive JavaScript features.

### Component Structure

The application will have a modular component structure with separate files for each component.

### CSS Layout Strategy

The application will use a global CSS file for global styles and a theme CSS file for custom properties.

### Data Structures

The application will use dummy data stored in a JSON file.

### Decision Plan

1. Create the file structure and add the necessary files
2. Design the shared navigation and footer components
3. Create the CSS custom properties for theming
4. Implement the interactive JavaScript features
5. Add dummy data to the JSON file
6. Test the application

### Bootstrap Choice

Not applicable for Vanilla HTML, CSS, and JavaScript.

### Acceptance Criteria

1. The application should render all pages correctly with proper styling and layout.
2. The application should display dummy data correctly with no errors or inconsistencies.
3. The application should respond correctly to user interactions.
4. The application should be fully responsive with proper styling and layout on different screen sizes and devices.
5. The code should be well-organized, readable, and maintainable.