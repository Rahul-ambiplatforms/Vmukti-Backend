const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  metadata: {
    urlWords: { type: String, required: true },
    metaTitle: { type: String, required: true },
    metaDescription: { type: String, required: true }
  },
  content: {
    title: { type: String, required: true },
    imageText: { type: String },
    mainImage: { type: String }, // URL to stored image
    brief: { type: mongoose.Schema.Types.Mixed, required: true }, // Slate editor content with formatting
    
    // Dynamic content array that can hold different types of content
    headingsAndImages: [{
      id: { type: String, required: true },
      type: { 
        type: String, 
        required: true,
        enum: ['headingElement36px', 'headingElement16px', 'textElement16px', 'imageVideo', 'cta']
      },
      // Using Mixed type to store different content structures
      content: { type: mongoose.Schema.Types.Mixed, required: true },
      // Optional htmlTag for headings
      htmlTag: String
    }],

    // FAQ section with structured question-answer pairs
    faqs: {
      title: String,
      items: [{
        id: { type: String, required: true },
        question: { type: String, required: true },
        // Using Mixed type for Slate editor content in answers
        answer: { type: mongoose.Schema.Types.Mixed, required: true }
      }]
    },

    // Store raw JSON schema as is
    schemas: [{
      id: { type: String, required: true },
      content: { type: mongoose.Schema.Types.Mixed, required: true } // Store raw JSON schema
    }]
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
blogSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add validation for content types
blogSchema.path('content.headingsAndImages').validate(function(items) {
  if (!Array.isArray(items)) return false;
  
  return items.every(item => {
    // Validate based on type
    switch(item.type) {
      case 'headingElement36px':
      case 'headingElement16px':
        return item.content.text && item.htmlTag; // Must have text content and htmlTag
      
      case 'textElement16px':
        return item.content.text && item.htmlTag === 'p'; // Must have text and be paragraph
      
      case 'imageVideo':
        return item.content.description && (item.content.file || item.content.url); // Must have description and file/url
      
      case 'cta':
        return item.content.ctaText && item.content.buttonText && item.content.buttonLink; // Must have all CTA fields
      
      default:
        return false; // Invalid type
    }
  });
}, 'Invalid content in headingsAndImages array');

module.exports = mongoose.model('Blog', blogSchema); 