# Ecommerce Backend Development Process Documentation

This document outlines the development process and key files within the `ecommerce-backend` directory of the eCommerce project. The backend is built with Node.js, Express.js, and MongoDB, serving as the central API and business logic hub for both the admin and customer-facing frontends.

## Project Setup and Initialization

The `ecommerce-backend` project was initialized as a Node.js application. This involved setting up `package.json` to manage dependencies and defining the main entry point (`server.js`).

## Core Components and Their Development

### `server.js` - The Application Entry Point

`server.js` is the heart of the backend application. Its development involved setting up the Express.js server, connecting to the MongoDB database, configuring middleware, and defining the main API routes.

**Development Steps:**
1.  **Express Application Setup:** An Express application instance was created.
2.  **Database Connection:** Mongoose was used to establish a connection to the MongoDB database. This involved configuring the `MONGO_URI` from environment variables.
3.  **Middleware Configuration:** Essential middleware such as `cors` (for handling cross-origin requests), `body-parser` (for parsing JSON and URL-encoded data), and potentially custom error handling middleware were integrated.
4.  **Route Mounting:** All API routes (e.g., authentication, product, order, user routes) were imported and mounted onto the Express application.
5.  **Server Start:** The Express application was configured to listen on a specified port, making the API accessible.
6.  **Development Utilities:** `nodemon` was configured for automatic server restarts during development, enhancing developer productivity.

### `models/` Directory - Defining Data Schemas

The `models` directory contains Mongoose schema definitions for the application's data entities. Each file in this directory (`User.js`, `Product.js`, `Order.js`, `Cart.js`, `Wishlist.js`, `Review.js`, `Admin.js`) represents a distinct data model and its structure in the MongoDB database.

**Development Steps (for each model):**
1.  **Schema Definition:** A new Mongoose `Schema` was defined, specifying the fields, their data types, validation rules (e.g., `required`, `unique`, `enum`), and relationships with other models (e.g., `ref` for `ObjectId` references).
2.  **Pre-save Hooks:** For models like `User` and `Admin`, pre-save hooks were implemented to hash passwords using `bcrypt` or `bcryptjs` before saving them to the database, ensuring security.
3.  **Model Export:** The schema was compiled into a Mongoose model and exported for use in controllers and other parts of the application.

**Key Models Developed:**
-   **`User.js`:** Defines the schema for customer accounts, including authentication details and personal information.
-   **`Product.js`:** Defines the schema for products, including details like name, price, stock, images, and categories.
-   **`Order.js`:** Defines the schema for customer orders, linking users to products and tracking order status.
-   **`Cart.js`:** Defines the schema for user shopping carts, storing temporary product selections.
-   **`Wishlist.js`:** Defines the schema for user wishlists, allowing users to save products for later.
-   **`Review.js`:** Defines the schema for product reviews, linking reviews to users and products.
-   **`Admin.js`:** Defines the schema for administrator accounts, potentially with specific admin-related fields.

### `controllers/` Directory - Implementing Business Logic

The `controllers` directory houses the business logic for handling API requests. Each controller file (e.g., `productController.js`) contains functions that interact with the Mongoose models, process request data, and send responses.

**Development Steps (for each controller function):**
1.  **Request Handling:** Functions were created to handle specific HTTP methods and routes (e.g., `getProduct`, `createProduct`, `updateProduct`, `deleteProduct`).
2.  **Data Validation:** Input data from requests was validated to ensure integrity and prevent malicious input.
3.  **Database Interaction:** Mongoose model methods were used to perform CRUD operations on the database.
4.  **Error Handling:** `try-catch` blocks were used to gracefully handle errors during database operations or other processes, sending appropriate HTTP status codes and error messages.
5.  **Response Generation:** JSON responses were constructed and sent back to the client, containing the requested data or confirmation messages.

**Key Controllers Developed:**
-   **`productController.js`:** Manages all product-related operations, including image uploads to Cloudinary.
-   *(Other controllers for authentication, users, orders, categories, reviews would follow a similar development pattern.)*

### `routes/` Directory - Defining API Endpoints

The `routes` directory defines the API endpoints and maps them to the corresponding controller functions. This separation of concerns keeps the routing logic clean and organized.

**Development Steps (for each route file):**
1.  **Router Initialization:** An Express `Router` instance was created.
2.  **Route Definition:** HTTP methods (GET, POST, PUT, DELETE) and their respective paths were defined.
3.  **Controller Mapping:** Each route was mapped to a specific function in a controller file.
4.  **Middleware Integration:** Authentication and authorization middleware (e.g., `authMiddleware`, `adminMiddleware`) were applied to protected routes to ensure only authorized users could access them.

### `middleware/` Directory - Intercepting Requests

The `middleware` directory contains custom middleware functions used to process requests before they reach the route handlers. This includes authentication checks, authorization checks, and potentially other request pre-processing.

**Development Steps:**
1.  **Authentication Middleware:** A middleware function was developed to verify the JWT from the request header, decode it, and attach the user information to the request object (`req.user`).
2.  **Authorization Middleware:** Middleware functions were created to check the user's role (`req.user.role`) and determine if they have the necessary permissions to access a particular route. If not authorized, an error response was sent.

### `utils/` Directory - Helper Functions and Configurations

The `utils` directory typically contains helper functions, configuration files, and other utilities that are used across the backend application.

**Development Steps:**
1.  **Environment Variable Management:** `dotenv` was configured to load environment variables from a `.env` file, ensuring sensitive information is not hardcoded.
2.  **Cloudinary Configuration:** Configuration for Cloudinary (cloud name, API key, API secret) was set up to enable image uploads.
3.  **Email Transporter:** Nodemailer transporter configuration was set up for sending emails.

### `uploads/` Directory - File Storage

The `uploads` directory is used for temporary storage of files (e.g., product images, user avatars) before they are processed and uploaded to cloud storage like Cloudinary. This directory is typically ignored by version control.

This structured approach to backend development ensures a robust, secure, and scalable foundation for the eCommerce platform.

