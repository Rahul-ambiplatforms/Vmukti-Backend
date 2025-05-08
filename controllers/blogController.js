const Blog = require('../models/Blog');

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    console.log('Request content type:', req.get('Content-Type'));
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);

    let blogData;

    // Handle both JSON and FormData submissions
    if (req.is('multipart/form-data')) {
      console.log('Processing as multipart/form-data');
      if (!req.body.formattedData) {
        console.log('Missing formattedData in form data');
        return res.status(400).json({
          status: 'error',
          message: 'formattedData is required for multipart/form-data'
        });
      }
      try {
        blogData = JSON.parse(req.body.formattedData);
        console.log('Parsed formattedData:', blogData);
      } catch (parseError) {
        console.error('Error parsing formattedData:', parseError);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid JSON format in formattedData',
          details: parseError.message
        });
      }
      
      // Handle file uploads if present
      if (req.files) {
        // Handle main image
        if (req.files.mainImage) {
          blogData.content.mainImage = `/uploads/${req.files.mainImage[0].filename}`;
        }

        // Handle imageVideo files - exactly like mainImage
        if (req.files.imageVideo && blogData.content.headingsAndImages) {
          const imageFiles = req.files.imageVideo;
          let fileIndex = 0;

          blogData.content.headingsAndImages = blogData.content.headingsAndImages.map(item => {
            if (item.type === 'imageVideo') {
              // Only process if we have a file for this image
              if (fileIndex < imageFiles.length) {
                item.content.url = `/uploads/${imageFiles[fileIndex].filename}`;
                fileIndex++;
              }
            }
            return item;
          });
        }
      }
    } else {
      console.log('Processing as direct JSON');
      blogData = req.body;
    }

    // Log the final data before validation
    console.log('Final blog data:', blogData);
    console.log('Has metadata:', !!blogData?.metadata);
    console.log('Has content:', !!blogData?.content);

    // Validate required fields
    if (!blogData?.metadata || !blogData?.content) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: metadata and content'
      });
    }

    // Create and save the blog
    const blog = new Blog(blogData);
    await blog.save();

    res.status(201).json({
      status: 'success',
      data: blog
    });
  } catch (error) {
    console.error('Blog creation error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all blogs with pagination
exports.getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Blog.countDocuments();

    res.status(200).json({
      status: 'success',
      data: blogs,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get a single blog by ID
exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({
        status: 'error',
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: blog
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update a blog
exports.updateBlog = async (req, res) => {
  try {
    let blogData;

    // Handle both JSON and FormData submissions
    if (req.is('multipart/form-data')) {
      blogData = JSON.parse(req.body.formattedData);
      
      // Handle file uploads if present
      if (req.files) {
        if (req.files.mainImage) {
          blogData.content.mainImage = `/uploads/${req.files.mainImage[0].filename}`;
        }

        // Handle imageVideo files - exactly like mainImage
        if (req.files.imageVideo && blogData.content.headingsAndImages) {
          const imageFiles = req.files.imageVideo;
          let fileIndex = 0;

          blogData.content.headingsAndImages = blogData.content.headingsAndImages.map(item => {
            if (item.type === 'imageVideo') {
              // Only process if we have a file for this image
              if (fileIndex < imageFiles.length) {
                item.content.url = `/uploads/${imageFiles[fileIndex].filename}`;
                fileIndex++;
              }
            }
            return item;
          });
        }
      }
    } else {
      // Direct JSON submission
      blogData = req.body;
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      blogData,
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({
        status: 'error',
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: blog
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete a blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        status: 'error',
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update blog status
exports.updateBlogStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status value'
      });
    }

    const blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!blog) {
      return res.status(404).json({
        status: 'error',
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: blog
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
}; 