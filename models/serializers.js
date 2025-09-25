// Property Serializer
class PropertySerializer {
  static serialize(property) {
    return {
      id: property.id,
      title: property.title,
      description: property.description,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      area: property.area,
      location: property.location,
      city: property.city,
      state: property.state,
      pincode: property.pincode,
      price: property.price,
      priceFormatted: property.priceFormatted,
      type: property.type,
      status: property.status,
      featured: property.featured,
      amenities: property.amenities,
      images: property.images,
      agent: AgentSerializer.serialize(property.agent),
      createdAt: property.createdAt,
      updatedAt: property.updatedAt
    };
  }

  static serializeList(properties) {
    return properties.map(property => this.serialize(property));
  }

  static deserialize(data) {
    return {
      id: data.id || null,
      title: data.title || '',
      description: data.description || '',
      bedrooms: parseInt(data.bedrooms) || 1,
      bathrooms: parseInt(data.bathrooms) || 1,
      area: data.area || '',
      location: `${data.city}, ${data.state}`,
      city: data.city || '',
      state: data.state || '',
      pincode: data.pincode || '',
      price: parseInt(data.price) || 0,
      priceFormatted: `₹${parseInt(data.price || 0).toLocaleString('en-IN')}`,
      type: data.type || 'Apartment',
      status: data.status || 'For Sale',
      featured: data.featured === 'true' || data.featured === true,
      amenities: Array.isArray(data.amenities) ? data.amenities : 
                 typeof data.amenities === 'string' ? JSON.parse(data.amenities) : [],
      images: data.images || [],
      agent: AgentSerializer.deserialize(data),
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

// Agent Serializer
class AgentSerializer {
  static serialize(agent) {
    return {
      name: agent.name,
      phone: agent.phone,
      email: agent.email,
      image: agent.image || null
    };
  }

  static deserialize(data) {
    return {
      name: data.agentName || data.name || '',
      phone: data.agentPhone || data.phone || '',
      email: data.agentEmail || data.email || '',
      image: data.agentImage || data.image || null
    };
  }
}

// Testimonial Serializer
class TestimonialSerializer {
  static serialize(testimonial) {
    return {
      id: testimonial.id,
      title: testimonial.title,
      content: testimonial.content,
      author: testimonial.author,
      location: testimonial.location,
      profileImage: testimonial.profileImage,
      rating: testimonial.rating,
      featured: testimonial.featured,
      createdAt: testimonial.createdAt,
      updatedAt: testimonial.updatedAt
    };
  }

  static serializeList(testimonials) {
    return testimonials.map(testimonial => this.serialize(testimonial));
  }

  static deserialize(data) {
    return {
      id: data.id || null,
      title: data.title || '',
      content: data.content || '',
      author: data.author || '',
      location: data.location || '',
      profileImage: data.profileImage || '',
      rating: parseInt(data.rating) || 5,
      featured: data.featured === 'true' || data.featured === true,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

// FAQ Serializer
class FAQSerializer {
  static serialize(faq) {
    return {
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      featured: faq.featured,
      order: faq.order,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt
    };
  }

  static serializeList(faqs) {
    return faqs.map(faq => this.serialize(faq));
  }

  static deserialize(data) {
    return {
      id: data.id || null,
      question: data.question || '',
      answer: data.answer || '',
      category: data.category || 'General',
      featured: data.featured === 'true' || data.featured === true,
      order: parseInt(data.order) || 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

// User Serializer
class UserSerializer {
  static serialize(user) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
  }

  static deserialize(data) {
    return {
      id: data.id || null,
      username: data.username || '',
      email: data.email || '',
      role: data.role || 'admin',
      createdAt: data.createdAt || new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
  }
}

// Statistics Serializer
class StatsSerializer {
  static serialize(stats) {
    return {
      totalProperties: stats.totalProperties || 0,
      featuredProperties: stats.featuredProperties || 0,
      totalTestimonials: stats.totalTestimonials || 0,
      totalFAQs: stats.totalFAQs || 0,
      propertiesByType: stats.propertiesByType || {},
      propertiesByCity: stats.propertiesByCity || {},
      averagePrice: stats.averagePrice || 0,
      totalValue: stats.totalValue || 0,
      recentActivity: stats.recentActivity || []
    };
  }
}

module.exports = {
  PropertySerializer,
  AgentSerializer,
  TestimonialSerializer,
  FAQSerializer,
  UserSerializer,
  StatsSerializer
};