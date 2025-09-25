import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import multer from "multer";
import path from "path";
import fs from "fs";

dotenv.config();

import Property from "./models/Property.js";
import Testimonial from "./models/Testimonial.js";
import FAQ from "./models/FAQ.js";
import database from "./database/database.js";

import "./services/passport.js";
import authRoutes from "./routes/AuthRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Helmet security - disable CSP to avoid CORS conflicts
helmet({
  crossOriginResourcePolicy: false,
});
// Simple CORS - Allow all origins
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(morgan("combined"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24h
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Uploads dir
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploads (CORS already handled globally above)
app.use("/uploads", express.static(uploadsDir));

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

// Utility error handler
const handleError = (res, error, message = "An error occurred") => {
  console.error("Error:", error);
  res.status(500).json({
    success: false,
    message,
    error: error.message || String(error),
  });
};

// Routes
app.use("/api/auth", authRoutes);

app.get("/api/properties", async (req, res) => {
  try {
    const filters = {
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      city: req.query.city,
      type: req.query.type,
      bedrooms: req.query.bedrooms,
      search: req.query.search,
      featured: req.query.featured,
      sortBy: req.query.sortBy || "created_at",
      sortOrder: req.query.sortOrder || "DESC",
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };

    const [properties, total] = await Promise.all([
      Property.findAll(filters, pagination),
      Property.count(filters),
    ]);

    const totalPages = Math.ceil(total / pagination.limit);

    res.json({
      success: true,
      data: properties,
      pagination: {
        currentPage: pagination.page,
        totalPages,
        totalProperties: total,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
        limit: pagination.limit,
      },
    });
  } catch (error) {
    handleError(res, error, "Error fetching properties");
  }
});

app.get("/api/properties/:id", async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found",
      });
    }

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    handleError(res, error, "Error fetching property");
  }
});

app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(req.body,adminCredentials) ;
    console.log(adminCredentials.username == username);
    console.log(adminCredentials.password == password);

    
    if (username === adminCredentials.username && password === adminCredentials.password) {
      console.log(true) ;
      res.json({
        success: true,
        message: 'Login successful',
        token: 'admin-token-' + Date.now()
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
  } catch (error) {
    handleError(res, error, 'Login error');
  }
});

// ADMIN PROPERTY ROUTES

// Get all properties for admin
app.get('/api/admin/properties', async (req, res) => {
  try {
    const properties = await Property.findAll({}, { page: 1, limit: 1000 });
    const total = await Property.count({});
    
    // Transform image paths to full URLs
    const propertiesWithFullUrls = properties.map(property => ({
      ...property,
      images: property.images.map(image => {
        if (image.startsWith('http')) {
          return image;
        }
        return `${req.protocol}://${req.get('host')}${image}`;
      })
    }));
    
    res.json({
      success: true,
      data: propertiesWithFullUrls,
      total: total
    });
  } catch (error) {
    handleError(res, error, 'Error fetching properties');
  }
});
app.get("/api/testimonials", async (req, res) => {
  try {
    const filters = { featured: req.query.featured };
    const testimonials = await Testimonial.findAll(filters);

    res.json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    handleError(res, error, "Error fetching testimonials");
  }
});

app.get("/api/faqs", async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      featured: req.query.featured,
    };

    const faqs = await FAQ.findAll(filters);

    res.json({
      success: true,
      data: faqs,
    });
  } catch (error) {
    handleError(res, error, "Error fetching FAQs");
  }
});

// Admin login
const adminCredentials = {
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "admin123",
};

app.post('/api/admin/properties', upload.array('images', 10), async (req, res) => {
  try {
    // console.log('Creating property  data:', req.body);
    // console.log('Files received:', req.files);

    // Process uploaded images
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    
    // Parse amenities if it's a string
    let amenities = [];
    if (req.body.amenities) {
      try {
        amenities = typeof req.body.amenities === 'string' 
          ? JSON.parse(req.body.amenities) 
          : req.body.amenities;
      } catch (e) {
        amenities = req.body.amenities.split(',').map(a => a.trim());
      }
    }

    const propertyData = {
      title: req.body.title || '',
      description: req.body.description || '',
      bedrooms: parseInt(req.body.bedrooms) || 1,
      bathrooms: parseInt(req.body.bathrooms) || 1,
      area: req.body.area || '',
      city: req.body.city || '',
      state: req.body.state || '',
      pincode: req.body.pincode || '',
      price: parseInt(req.body.price) || 0,
      type: req.body.type || 'Apartment',
      status: req.body.status || 'For Sale',
      featured: req.body.featured === 'true' || req.body.featured === true,
      amenities: amenities,
      images: images,
      location: `${req.body.city}, ${req.body.state}`
    };
    
    propertyData.priceFormatted = `₹${parseInt(propertyData.price).toLocaleString('en-IN')}`;
    
    console.log('Processed property data:', propertyData);
    
    const property = new Property(propertyData);
    const id = await property.save();
    
    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: { ...propertyData, id }
    });
  } catch (error) {
    console.error('Error creating property:', error);
    handleError(res, error, 'Error creating property');
  }
});

// Update property
app.put('/api/admin/properties/:id', upload.array('images', 10), async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    const newImages = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];
    const keepExistingImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : [];
    const allImages = [...keepExistingImages, ...newImages];
    
    let amenities = property.amenities;
    if (req.body.amenities) {
      try {
        amenities = typeof req.body.amenities === 'string' 
          ? JSON.parse(req.body.amenities) 
          : req.body.amenities;
      } catch (e) {
        amenities = req.body.amenities.split(',').map(a => a.trim());
      }
    }

    const updatedData = {
      title: req.body.title || property.title,
      description: req.body.description || property.description,
      bedrooms: parseInt(req.body.bedrooms) || property.bedrooms,
      bathrooms: parseInt(req.body.bathrooms) || property.bathrooms,
      area: req.body.area || property.area,
      city: req.body.city || property.city,
      state: req.body.state || property.state,
      pincode: req.body.pincode || property.pincode,
      price: parseInt(req.body.price) || property.price,
      type: req.body.type || property.type,
      status: req.body.status || property.status,
      featured: req.body.featured === 'true' || req.body.featured === true,
      amenities: amenities,
      images: allImages,
      location: `${req.body.city || property.city}, ${req.body.state || property.state}`
    };
    
    updatedData.priceFormatted = `₹${parseInt(updatedData.price).toLocaleString('en-IN')}`;
    
    Object.assign(property, updatedData);
    await property.save();
    
    res.json({
      success: true,
      message: 'Property updated successfully',
      data: property
    });
  } catch (error) {
    handleError(res, error, 'Error updating property');
  }
});

// Delete property
app.delete('/api/admin/properties/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    await Property.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Property deleted successfully',
      data: property
    });
  } catch (error) {
    handleError(res, error, 'Error deleting property');
  }
});

// ADMIN TESTIMONIAL ROUTES

// Get all testimonials for admin
app.get('/api/admin/testimonials', async (req, res) => {
  try {
    const testimonials = await Testimonial.findAll({});
    
    res.json({
      success: true,
      data: testimonials,
      total: testimonials.length
    });
  } catch (error) {
    handleError(res, error, 'Error fetching testimonials');
  }
});

// Create new testimonial
app.post('/api/admin/testimonials', upload.single('profileImage'), async (req, res) => {
  try {
    console.log('Creating testimonial  data:', req.body);
    console.log('File received:', req.file);

    const profileImage = req.file ? `/uploads/${req.file.filename}` : req.body.profileImage || '';
    
    const testimonialData = {
      title: req.body.title || '',
      content: req.body.content || '',
      author: req.body.author || '',
      location: req.body.location || '',
      profileImage: profileImage,
      rating: parseInt(req.body.rating) || 5,
      featured: req.body.featured === 'true' || req.body.featured === true
    };
    
    console.log('Processed testimonial data:', testimonialData);
    
    const testimonial = new Testimonial(testimonialData);
    const id = await testimonial.save();
    
    res.status(201).json({
      success: true,
      message: 'Testimonial created successfully',
      data: { ...testimonialData, id }
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    handleError(res, error, 'Error creating testimonial');
  }
});

// Update testimonial
app.put('/api/admin/testimonials/:id', upload.single('profileImage'), async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }
    
    const profileImage = req.file ? `/uploads/${req.file.filename}` : 
                        req.body.profileImage || testimonial.profileImage;
    
    const updatedData = {
      title: req.body.title || testimonial.title,
      content: req.body.content || testimonial.content,
      author: req.body.author || testimonial.author,
      location: req.body.location || testimonial.location,
      profileImage: profileImage,
      rating: parseInt(req.body.rating) || testimonial.rating,
      featured: req.body.featured === 'true' || req.body.featured === true
    };
    
    Object.assign(testimonial, updatedData);
    await testimonial.save();
    
    res.json({
      success: true,
      message: 'Testimonial updated successfully',
      data: testimonial
    });
  } catch (error) {
    handleError(res, error, 'Error updating testimonial');
  }
});

// Delete testimonial
app.delete('/api/admin/testimonials/:id', async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    
    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: 'Testimonial not found'
      });
    }
    
    await Testimonial.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Testimonial deleted successfully',
      data: testimonial
    });
  } catch (error) {
    handleError(res, error, 'Error deleting testimonial');
  }
});

// ADMIN FAQ ROUTES

// Get all FAQs for admin
app.get('/api/admin/faqs', async (req, res) => {
  try {
    const faqs = await FAQ.findAll({});
    
    res.json({
      success: true,
      data: faqs,
      total: faqs.length
    });
  } catch (error) {
    handleError(res, error, 'Error fetching FAQs');
  }
});

// Create new FAQ
app.post('/api/admin/faqs', async (req, res) => {
  try {
    console.log('Creating FAQ  data:', req.body);

    const faqData = {
      question: req.body.question || '',
      answer: req.body.answer || '',
      category: req.body.category || 'General',
      featured: req.body.featured === 'true' || req.body.featured === true,
      order: parseInt(req.body.order) || 0
    };
    
    console.log('Processed FAQ data:', faqData);
    
    const faq = new FAQ(faqData);
    const id = await faq.save();
    
    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: { ...faqData, id }
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    handleError(res, error, 'Error creating FAQ');
  }
});

// Update FAQ
app.put('/api/admin/faqs/:id', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    const updatedData = {
      question: req.body.question || faq.question,
      answer: req.body.answer || faq.answer,
      category: req.body.category || faq.category,
      featured: req.body.featured === 'true' || req.body.featured === true,
      order: parseInt(req.body.order) || faq.order
    };
    
    Object.assign(faq, updatedData);
    await faq.save();
    
    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data: faq
    });
  } catch (error) {
    handleError(res, error, 'Error updating FAQ');
  }
});

// Delete FAQ
app.delete('/api/admin/faqs/:id', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    await FAQ.delete(req.params.id);
    
    res.json({
      success: true,
      message: 'FAQ deleted successfully',
      data: faq
    });
  } catch (error) {
    handleError(res, error, 'Error deleting FAQ');
  }
});

// Get statistics
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [properties, testimonials, faqs] = await Promise.all([
      Property.findAll({}, { page: 1, limit: 1000 }),
      Testimonial.findAll({}),
      FAQ.findAll({})
    ]);

    const stats = {
      totalProperties: properties.length,
      featuredProperties: properties.filter(p => p.featured).length,
      totalTestimonials: testimonials.length,
      totalFAQs: faqs.length,
      propertiesByType: {},
      propertiesByCity: {},
      averagePrice: 0,
      totalValue: 0
    };
    
    // Calculate statistics
    properties.forEach(property => {
      stats.propertiesByType[property.type] = (stats.propertiesByType[property.type] || 0) + 1;
      stats.propertiesByCity[property.city] = (stats.propertiesByCity[property.city] || 0) + 1;
      stats.totalValue += property.price;
    });
    
    stats.averagePrice = stats.totalProperties > 0 ? Math.round(stats.totalValue / stats.totalProperties) : 0;
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    handleError(res, error, 'Error fetching statistics');
  }
});

app.post("/api/admin/login", (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      username === adminCredentials.username &&
      password === adminCredentials.password
    ) {
      return res.json({
        success: true,
        message: "Login successful",
        token: "admin-token-" + Date.now(),
      });
    }

    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  } catch (error) {
    handleError(res, error, "Login error");
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 10MB.",
      });
    }
  }

  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: error.message || String(error),
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  try {
    await database.close();
  } catch (e) {
    console.warn("Error closing database connection:", e);
  }
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(
    `📊 Admin credentials: username=${adminCredentials.username}, password=${adminCredentials.password}`
  );
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});
