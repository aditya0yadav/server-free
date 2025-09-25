import database from '../database/database.js';

class Property {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.description = data.description || '';
    this.bedrooms = data.bedrooms || 1;
    this.bathrooms = data.bathrooms || 1;
    this.area = data.area || '';
    this.location = data.location || '';
    this.city = data.city || '';
    this.state = data.state || '';
    this.pincode = data.pincode || '';
    this.price = data.price || 0;
    this.priceFormatted = data.price_formatted || this.formatPrice(data.price);
    this.type = data.type || 'Apartment';
    this.status = data.status || 'For Sale';
    this.featured = data.featured || false;
    this.amenities = Array.isArray(data.amenities) ? data.amenities : 
                    typeof data.amenities === 'string' ? JSON.parse(data.amenities || '[]') : [];
    this.images = Array.isArray(data.images) ? data.images : 
                  typeof data.images === 'string' ? JSON.parse(data.images || '[]') : [];
    this.createdAt = data.created_at || new Date().toISOString();
    this.updatedAt = data.updated_at || new Date().toISOString();
  }

  formatPrice(price) {
    if (!price) return '₹0';
    return `₹${parseInt(price).toLocaleString('en-IN')}`;
  }

  static async findAll(filters = {}, pagination = {}) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      let query = 'SELECT * FROM properties WHERE 1=1';
      const params = [];

      // Apply filters
      if (filters.minPrice) {
        query += ' AND price >= ?';
        params.push(filters.minPrice);
      }
      if (filters.maxPrice) {
        query += ' AND price <= ?';
        params.push(filters.maxPrice);
      }
      if (filters.city) {
        query += ' AND city LIKE ?';
        params.push(`%${filters.city}%`);
      }
      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }
      if (filters.bedrooms) {
        query += ' AND bedrooms >= ?';
        params.push(filters.bedrooms);
      }
      if (filters.search) {
        query += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      if (filters.featured === 'true') {
        query += ' AND featured = 1';
      }

      // Add sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'DESC';
      query += ` ORDER BY ${sortBy} ${sortOrder}`;

      // Add pagination
      const limit = parseInt(pagination.limit) || 10;
      const offset = (parseInt(pagination.page) - 1) * limit || 0;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const properties = rows.map(row => new Property(row));
          resolve(properties);
        }
      });
    });
  }

  static async count(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      let query = 'SELECT COUNT(*) as total FROM properties WHERE 1=1';
      const params = [];

      // Apply same filters as findAll
      if (filters.minPrice) {
        query += ' AND price >= ?';
        params.push(filters.minPrice);
      }
      if (filters.maxPrice) {
        query += ' AND price <= ?';
        params.push(filters.maxPrice);
      }
      if (filters.city) {
        query += ' AND city LIKE ?';
        params.push(`%${filters.city}%`);
      }
      if (filters.type) {
        query += ' AND type = ?';
        params.push(filters.type);
      }
      if (filters.bedrooms) {
        query += ' AND bedrooms >= ?';
        params.push(filters.bedrooms);
      }
      if (filters.search) {
        query += ' AND (title LIKE ? OR description LIKE ? OR location LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      if (filters.featured === 'true') {
        query += ' AND featured = 1';
      }

      db.get(query, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row.total);
        }
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      db.get('SELECT * FROM properties WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new Property(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  async save() {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      
      if (this.id) {
        // Update existing property
        const query = `
          UPDATE properties SET 
            title = ?, description = ?, bedrooms = ?, bathrooms = ?, area = ?,
            location = ?, city = ?, state = ?, pincode = ?, price = ?, price_formatted = ?,
            type = ?, status = ?, featured = ?, amenities = ?, images = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        const params = [
          this.title, this.description, this.bedrooms, this.bathrooms, this.area,
          this.location, this.city, this.state, this.pincode, this.price, this.priceFormatted,
          this.type, this.status, this.featured ? 1 : 0, JSON.stringify(this.amenities), 
          JSON.stringify(this.images), this.id
        ];

        db.run(query, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        });
      } else {
        // Create new property
        const query = `
          INSERT INTO properties (title, description, bedrooms, bathrooms, area, location, city, state, pincode, price, price_formatted, type, status, featured, amenities, images)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
          this.title, this.description, this.bedrooms, this.bathrooms, this.area,
          this.location, this.city, this.state, this.pincode, this.price, this.priceFormatted,
          this.type, this.status, this.featured ? 1 : 0, JSON.stringify(this.amenities), 
          JSON.stringify(this.images)
        ];

        db.run(query, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        });
      }
    });
  }

  static async delete(id) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      db.run('DELETE FROM properties WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }
}

export default Property;