import sqlite3pkg from 'sqlite3';
const sqlite3 = sqlite3pkg.verbose();
import path from 'path';
import { fileURLToPath } from 'url';

class Database {
  constructor() {
    this.db = null;
    this.init();
  }

  init() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbPath = path.join(__dirname, 'rentwala.db');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to SQLite database');
        this.createTables();
      }
    });
  }

  createTables() {
    // Properties table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        bedrooms INTEGER,
        bathrooms INTEGER,
        area TEXT,
        location TEXT,
        city TEXT,
        state TEXT,
        pincode TEXT,
        price INTEGER,
        price_formatted TEXT,
        type TEXT,
        status TEXT,
        featured BOOLEAN DEFAULT 0,
        amenities TEXT,
        images TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Testimonials table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS testimonials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT,
        author TEXT,
        location TEXT,
        profile_image TEXT,
        rating INTEGER DEFAULT 5,
        featured BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // FAQs table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS faqs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        answer TEXT,
        category TEXT,
        featured BOOLEAN DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample data
    this.insertSampleData();
  }

  insertSampleData() {
    // Check if data already exists
    this.db.get("SELECT COUNT(*) as count FROM properties", (err, row) => {
      if (err) {
        console.error('Error checking properties:', err);
        return;
      }

      if (row.count === 0) {
        // Insert sample properties
        const sampleProperties = [
          {
            title: "Luxury Villa in DLF Phase 4",
            description: "A stunning 4-bedroom, 3-bathroom villa in a peaceful suburban neighborhood with modern amenities and premium finishes. This property features spacious rooms, a beautiful garden, and is located in one of Gurgaon's most prestigious areas.",
            bedrooms: 4,
            bathrooms: 3,
            area: "2,500 sq ft",
            location: "Gurgaon, Haryana",
            city: "Gurgaon",
            state: "Haryana",
            pincode: "122001",
            price: 25000000,
            price_formatted: "₹2,50,00,000",
            type: "Villa",
            status: "For Sale",
            featured: 1,
            amenities: JSON.stringify(["Swimming Pool", "Gym", "Garden", "Parking", "Security", "Power Backup"]),
            images: JSON.stringify([
              "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800",
              "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800",
              "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800"
            ])
          },
          {
            title: "Modern Apartment in Connaught Place",
            description: "A chic and fully-furnished 2-bedroom apartment with panoramic city views in the heart of Delhi. Perfect for professionals and small families looking for a premium living experience in the capital.",
            bedrooms: 2,
            bathrooms: 2,
            area: "1,200 sq ft",
            location: "Delhi, NCR",
            city: "Delhi",
            state: "Delhi",
            pincode: "110001",
            price: 17500000,
            price_formatted: "₹1,75,00,000",
            type: "Apartment",
            status: "For Sale",
            featured: 1,
            amenities: JSON.stringify(["Elevator", "Parking", "Security", "Power Backup", "Water Supply"]),
            images: JSON.stringify([
              "https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800",
              "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800"
            ])
          }
        ];

        sampleProperties.forEach(property => {
          this.db.run(`
            INSERT INTO properties (title, description, bedrooms, bathrooms, area, location, city, state, pincode, price, price_formatted, type, status, featured, amenities, images)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            property.title, property.description, property.bedrooms, property.bathrooms,
            property.area, property.location, property.city, property.state, property.pincode,
            property.price, property.price_formatted, property.type, property.status,
            property.featured, property.amenities, property.images
          ]);
        });
      }
    });

    // Insert sample testimonials
    this.db.get("SELECT COUNT(*) as count FROM testimonials", (err, row) => {
      if (err) return;

      if (row.count === 0) {
        const sampleTestimonials = [
          {
            title: "Exceptional Service!",
            content: "Our experience with Rentwala was outstanding. Their team's dedication and professionalism made finding our dream home a breeze. Highly recommended!",
            author: "Priya Sharma",
            location: "Gurgaon, Haryana",
            profile_image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200",
            rating: 5,
            featured: 1
          },
          {
            title: "Efficient and Reliable",
            content: "Rentwala provided us with top-notch service. They helped us sell our property quickly and at a great price. We couldn't be happier with the results.",
            author: "Rajesh Kumar",
            location: "Delhi, NCR",
            profile_image: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200",
            rating: 5,
            featured: 1
          }
        ];

        sampleTestimonials.forEach(testimonial => {
          this.db.run(`
            INSERT INTO testimonials (title, content, author, location, profile_image, rating, featured)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            testimonial.title, testimonial.content, testimonial.author,
            testimonial.location, testimonial.profile_image, testimonial.rating, testimonial.featured
          ]);
        });
      }
    });

    // Insert sample FAQs
    this.db.get("SELECT COUNT(*) as count FROM faqs", (err, row) => {
      if (err) return;

      if (row.count === 0) {
        const sampleFAQs = [
          {
            question: "How do I search for properties on Rentwala?",
            answer: "You can search for properties using our advanced search filters on the properties page. Filter by location, price range, property type, number of bedrooms, and more to find properties that match your criteria.",
            category: "Search",
            featured: 1,
            order_index: 1
          },
          {
            question: "What documents do I need to sell my property through Rentwala?",
            answer: "To sell your property, you'll need: Property title deed, NOC from society/builder, Property tax receipts, Electricity and water bills, Identity proof, and Address proof. Our team will guide you through the complete documentation process.",
            category: "Selling",
            featured: 1,
            order_index: 2
          }
        ];

        sampleFAQs.forEach(faq => {
          this.db.run(`
            INSERT INTO faqs (question, answer, category, featured, order_index)
            VALUES (?, ?, ?, ?, ?)
          `, [faq.question, faq.answer, faq.category, faq.featured, faq.order_index]);
        });
      }
    });
  }

  getDb() {
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

const databaseInstance = new Database();
export default databaseInstance;