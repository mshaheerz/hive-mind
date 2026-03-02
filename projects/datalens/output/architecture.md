## System Overview

DataLens is a web application designed to simplify the visualization and analysis of complex data sets. It targets data analysts and business intelligence professionals, providing interactive visualizations, integration with multiple data analysis libraries, and a user-friendly interface. The application aims to achieve 90% user satisfaction and a 30% increase in strategic decision accuracy.

## Component Diagram (Mermaid)
```mermaid
graph LR
    A[User] -->|Interacts with| B[Frontend (Next.js)]
    B -->|Fetches data from| C[API Routes (Next.js)]
    C -->|Queries| D[Database (Prisma)]
    C -->|Integrates with| E[Data Analysis Libraries (D3.js, Chart.js)]
    B -->|Renders| F[Visualizations (D3.js, Chart.js)]
    A -->|Configures| B
```

## Data Flow

1. The user interacts with the frontend, navigating to a dashboard or configuration page.
2. The frontend (Next.js) sends a request to the API Routes (Next.js) to fetch data.
3. The API Routes query the database (Prisma) to retrieve the required data.
4. The API Routes integrate with data analysis libraries (D3.js, Chart.js) to process and transform the data.
5. The processed data is sent back to the frontend, which renders interactive visualizations.

## File/Folder Structure
```markdown
components/
|---- Visualization.js
|---- Dashboard.js
|---- Header.js
|---- Footer.js
lib/
|---- api.js
|---- db.js
|---- utils.js
models/
|---- data.js
|---- visualization.js
pages/
|---- _app.js
|---- index.js
|---- dashboard.js
public/
|---- index.html
styles/
|---- globals.css
|---- tailwind.config.js
```

## Key Technical Decisions + Justification

* **Next.js 15**: Chosen for its server-side rendering, static site generation, and performance optimization capabilities, making it suitable for handling large datasets.
* **Tailwind CSS**: Selected for its utility-first approach to CSS, simplifying the development process and maintaining consistency across the application.
* **Lucide React**: Used for icons, providing a comprehensive set of customizable icons that enhance the user interface.
* **Prisma**: Utilized for database querying, providing a robust and scalable solution for data retrieval.
* **D3.js and Chart.js**: Integrated for data visualization, offering a range of interactive and customizable visualization options.

## Template/Bootstrap Plan

* **nextjs**: The chosen template/bootstrap plan is Next.js, which will be initialized using `npx create-next-app@latest`.

## FORGE EXECUTION CONTRACT

### Required Files

* `components/Visualization.js`
* `components/Dashboard.js`
* `lib/api.js`
* `lib/db.js`
* `models/data.js`
* `pages/_app.js`
* `pages/index.js`
* `pages/dashboard.js`

### Minimum Test Targets

* 80% code coverage
* 10 unit tests for frontend components
* 5 integration tests for API Routes

### Acceptance Criteria

* The application renders interactive visualizations for at least three different types of data sets within 2 seconds.
* The application successfully integrates with at least two data analysis libraries (e.g., D3.js, Chart.js) without errors.
* The application maintains a frame rate of 60 FPS when handling datasets exceeding 1 million records.
* The application's UI allows users to navigate and configure visualizations within 3 clicks.

### Non-Goals

* Support for offline data storage
* Integration with machine learning models

## What FORGE Needs to Know to Start Coding

* Confirmation of the tech stack (Next.js, Tailwind CSS, Lucide React, Prisma, D3.js, Chart.js)
* Details on data analysis libraries to be integrated
* Specific requirements for data visualization and dashboard configuration
* Information on scalability and performance expectations
* Any additional features or functionalities not mentioned in the project description