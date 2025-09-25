const database = require('../database/database');

class FAQ {
  constructor(data = {}) {
    this.id = data.id || null;
    this.question = data.question || '';
    this.answer = data.answer || '';
    this.category = data.category || 'General';
    this.featured = data.featured || false;
    this.order = data.order_index || 0;
    this.createdAt = data.created_at || new Date().toISOString();
    this.updatedAt = data.updated_at || new Date().toISOString();
  }

  static async findAll(filters = {}) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      let query = 'SELECT * FROM faqs WHERE 1=1';
      const params = [];

      if (filters.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters.featured === 'true') {
        query += ' AND featured = 1';
      }

      query += ' ORDER BY order_index ASC, created_at DESC';

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const faqs = rows.map(row => new FAQ(row));
          resolve(faqs);
        }
      });
    });
  }

  static async findById(id) {
    return new Promise((resolve, reject) => {
      const db = database.getDb();
      db.get('SELECT * FROM faqs WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(new FAQ(row));
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
        // Update existing FAQ
        const query = `
          UPDATE faqs SET 
            question = ?, answer = ?, category = ?, featured = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        const params = [
          this.question, this.answer, this.category, this.featured ? 1 : 0, this.order, this.id
        ];

        db.run(query, params, function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        });
      } else {
        // Create new FAQ
        const query = `
          INSERT INTO faqs (question, answer, category, featured, order_index)
          VALUES (?, ?, ?, ?, ?)
        `;
        const params = [
          this.question, this.answer, this.category, this.featured ? 1 : 0, this.order
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
      db.run('DELETE FROM faqs WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }
}

module.exports = FAQ;