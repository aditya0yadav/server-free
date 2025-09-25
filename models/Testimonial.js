const database = require('../database/database');

class Testimonial {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.content = data.content || '';
    this.author = data.author || '';
    this.location = data.location || '';
    this.profileImage = data.profile_image || '';
    this.rating = data.rating || 5;
    this.featured = data.featured || false;
    this.createdAt = data.created_at || new Date().toISOString();
    this.updatedAt = data.updated_at || new Date().toISOString();
  }

  static async findAll(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      let query = 'SELECT * FROM testimonials WHERE 1=1';
      const params = [];

      if (filters.featured === 'true') {
        query += ' AND featured = 1';
      }

      query += ' ORDER BY created_at DESC';

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const testimonials = rows.map(row => new Testimonial(row));
          resolve(testimonials);
        }
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      db.get('SELECT * FROM testimonials WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new Testimonial(row));
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
        // Update existing testimonial
        const query = `
          UPDATE testimonials SET 
            title = ?, content = ?, author = ?, location = ?, profile_image = ?,
            rating = ?, featured = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        const params = [
          this.title, this.content, this.author, this.location, this.profileImage,
          this.rating, this.featured ? 1 : 0, this.id
        ];

        db.run(query, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        });
      } else {
        // Create new testimonial
        const query = `
          INSERT INTO testimonials (title, content, author, location, profile_image, rating, featured)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
          this.title, this.content, this.author, this.location, this.profileImage,
          this.rating, this.featured ? 1 : 0
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
      db.run('DELETE FROM testimonials WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }
}

module.exports = Testimonial;