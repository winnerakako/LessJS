import {
  router,
  routes,
  Ok,
  Created,
  NoContent,
  NotFound,
  BadRequest,
  Unauthorized,
  Forbidden,
  Conflict,
  UnprocessableEntity,
  Dto,
} from "_lessjs/core";
import { Request, Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

class UserDTO {
  @IsString()
  @IsNotEmpty({ message: "First Name is required" })
  firstName!: string;
}

// ====================
// LESSJS ROUTING EXAMPLES - All Possibilities Demonstrated
// ====================

// ====================
// APPROACH 1: Fluent Router API (Recommended)
// ====================
// Clean, chainable API with automatic HTTP method controllers
export const fluentRouter = router()
  // Basic GET routes
  .get("/", (req, res) =>
    Ok({ message: "Welcome to LessJS API", version: "3.0" }, "API is running")
  )

  .get("/users", (req, res) =>
    Ok(
      {
        users: [
          { id: 1, name: "John Doe", email: "john@example.com" },
          { id: 2, name: "Jane Smith", email: "jane@example.com" },
        ],
      },
      "Users retrieved successfully"
    )
  )

  .get("/users/:id", (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) BadRequest("Invalid user ID");

    const user = { id: userId, name: "John Doe", email: "john@example.com" };
    if (!user) NotFound("User not found");

    return Ok({ user }, "User retrieved successfully");
  })

  // POST route with validation
  .post(
    "/users",
    (req: Request, res: Response) => {
      const { name, email } = req.body;
      return Created(
        {
          user: { id: Date.now(), name, email, createdAt: new Date() },
        },
        "User created successfully"
      );
    },

    Dto(UserDTO)
  )

  // PUT route for updates
  .put("/users/:id", (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) BadRequest("Invalid user ID");

    const { name, email } = req.body;
    if (!name && !email) BadRequest("At least one field is required");

    return Ok(
      {
        user: { id: userId, name, email, updatedAt: new Date() },
      },
      "User updated successfully"
    );
  })

  // PATCH route for partial updates
  .patch("/users/:id/status", (req, res) => {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      BadRequest("Status must be 'active' or 'inactive'");
    }

    return Ok(
      {
        user: { id: parseInt(req.params.id), status, updatedAt: new Date() },
      },
      "User status updated"
    );
  })

  // DELETE route
  .delete("/users/:id", (req, res) => {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) BadRequest("Invalid user ID");

    // NoContent() returns null and sets 204 status automatically
    return NoContent();
  })

  .build();

// ====================
// APPROACH 2: Object-Based Routes (Most Concise)
// ====================
// Perfect for simple APIs with minimal logic
export const objectRouter = routes({
  "GET /products": (req, res) =>
    Ok(
      {
        products: [
          { id: 1, name: "Laptop", price: 999.99 },
          { id: 2, name: "Mouse", price: 29.99 },
        ],
      },
      "Products retrieved"
    ),

  "GET /products/:id": (req, res) =>
    Ok({
      product: {
        id: parseInt(req.params.id),
        name: "Sample Product",
        price: 99.99,
      },
    }),

  "POST /products": (req, res) => {
    if (!req.body.name) BadRequest("Product name is required");
    return Created({
      product: { id: Date.now(), ...req.body, createdAt: new Date() },
    });
  },

  "PUT /products/:id": (req, res) =>
    Ok({
      product: {
        id: parseInt(req.params.id),
        ...req.body,
        updatedAt: new Date(),
      },
    }),

  "DELETE /products/:id": (req, res) => NoContent(),
});

// ====================
// APPROACH 3: Grouped Routes with Middleware
// ====================
// Perfect for organizing routes by functionality and applying common middleware

// Extend Request interface for user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        role: string;
        name?: string;
        email?: string;
      };
    }
  }
}

// Example middleware functions
const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization;
  if (!token) {
    Unauthorized("Authorization token required");
  }
  // In real app, verify JWT token here
  req.user = { id: 1, role: "admin" }; // Mock user
  next();
};

const adminMiddleware = (req: any, res: any, next: any) => {
  if (req.user?.role !== "admin") {
    Forbidden("Admin access required");
  }
  next();
};

const rateLimitMiddleware = (req: any, res: any, next: any) => {
  // Mock rate limiting
  console.log(`Rate limit check for IP: ${req.ip}`);
  next();
};

export const groupedRouter = router()
  // Public routes (no auth required)
  .group("/public", (pub) => {
    pub
      .get("/health", (req, res) =>
        Ok(
          {
            status: "healthy",
            timestamp: new Date(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || "development",
          },
          "System is healthy"
        )
      )

      .get("/version", (req, res) =>
        Ok({
          version: "3.0.0",
          build: "2024-01-01",
          framework: "LessJS",
        })
      )

      .post("/contact", (req, res) => {
        const { name, email, message } = req.body;
        if (!name || !email || !message) {
          BadRequest("Name, email, and message are required");
        }
        return Created(
          {
            contactId: Date.now(),
            status: "received",
          },
          "Message sent successfully"
        );
      });
  })

  // Protected routes (auth required)
  .group("/api", (api) => {
    api
      .use(authMiddleware) // Apply to all routes in this group
      .use(rateLimitMiddleware)

      .get("/profile", (req, res) =>
        Ok(
          {
            user: req.user,
            lastLogin: new Date(),
          },
          "Profile retrieved"
        )
      )

      .put("/profile", (req, res) => {
        const { name, email } = req.body;
        return Ok(
          {
            user: { ...req.user, name, email, updatedAt: new Date() },
          },
          "Profile updated"
        );
      })

      .post("/logout", (req, res) =>
        Ok({ message: "Logged out successfully" })
      );
  })

  // Admin-only routes (auth + admin role required)
  .group("/admin", (admin) => {
    admin
      .use(authMiddleware)
      .use(adminMiddleware)

      .get("/dashboard", (req, res) =>
        Ok(
          {
            stats: {
              totalUsers: 1250,
              totalOrders: 3420,
              revenue: 125000,
              activeUsers: 89,
            },
            charts: {
              dailySignups: [12, 15, 8, 22, 17],
              monthlyRevenue: [45000, 52000, 48000, 61000],
            },
          },
          "Dashboard data retrieved"
        )
      )

      .get("/users", (req, res) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        return Ok({
          users: [], // Mock empty array
          pagination: {
            page,
            limit,
            total: 1250,
            pages: Math.ceil(1250 / limit),
          },
        });
      })

      .delete("/users/:id", (req, res) => {
        const userId = parseInt(req.params.id);
        if (req.user && userId === req.user.id) {
          Conflict("Cannot delete your own account");
        }
        return NoContent();
      });
  })

  .build();

// ====================
// ERROR HANDLING EXAMPLES
// ====================
export const errorExamplesRouter = router()
  .get("/errors/400", (req, res) => {
    BadRequest("This is a bad request example");
  })

  .get("/errors/401", (req, res) => {
    Unauthorized("You are not authorized to access this resource");
  })

  .get("/errors/403", (req, res) => {
    Forbidden("You don't have permission to access this resource");
  })

  .get("/errors/404", (req, res) => {
    NotFound("The requested resource was not found");
  })

  .get("/errors/409", (req, res) => {
    Conflict("This resource already exists");
  })

  .get("/errors/422", (req, res) => {
    UnprocessableEntity("Validation failed", {
      errors: {
        email: "Email is required",
        age: "Age must be between 18 and 120",
      },
    });
  })

  .build();

// ====================
// COMPARISON: Before vs After
// ====================

/*
BEFORE (Traditional Express + Old Controller):
```typescript
import express from "express";
import { Controller } from "_lessjs/core/controller";
const router = express.Router();

router.get("/users", Controller(200, (req, res) => {
  return {
    message: "Users retrieved successfully",
    users: []
  };
}));

router.post("/users", Controller(201, (req, res) => {
  if (!req.body.name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  return {
    message: "User created successfully", 
    user: { id: 123, ...req.body }
  };
}));

export default router;
```

AFTER (LessJS Fluent Router):
```typescript
import { router, Ok, Created, BadRequest } from "_lessjs/core";

export default router()
  .get("/users", (req, res) => 
    Ok({ users: [] }, "Users retrieved successfully"))
  
  .post("/users", (req, res) => {
    if (!req.body.name) BadRequest("Name is required");
    return Created({ user: { id: 123, ...req.body } }, "User created successfully");
  })
  
  .build();
```

OR even more concise with object-based routes:
```typescript
import { routes, Ok, Created, BadRequest } from "_lessjs/core";

export default routes({
  "GET /users": (req, res) => Ok({ users: [] }, "Users retrieved successfully"),
  "POST /users": (req, res) => {
    if (!req.body.name) BadRequest("Name is required");
    return Created({ user: { id: 123, ...req.body } }, "User created successfully");
  }
});
```
*/

// ====================
// AVAILABLE RESPONSE HELPERS
// ====================
/*
Response Helpers:
- Ok(data, message?) - 200 status with data
- Created(data, message?) - 201 status with data  
- NoContent() - 204 status with no body

Error Helpers (automatically throw with correct status):
- BadRequest(message) - 400 status
- Unauthorized(message) - 401 status  
- Forbidden(message) - 403 status
- NotFound(message) - 404 status
- Conflict(message) - 409 status
- UnprocessableEntity(message, data?) - 422 status with validation errors

HTTP Method Controllers (used internally by router):
- Get(handler, options?) - GET requests (200 default)
- Post(handler, options?) - POST requests (201 default)  
- Put(handler, options?) - PUT requests (200 default)
- Patch(handler, options?) - PATCH requests (200 default)
- Delete(handler, options?) - DELETE requests (204 default)
*/

// Export the recommended approach as default
export default fluentRouter;
