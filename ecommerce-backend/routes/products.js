const express = require("express");
const router = express.Router();
const multer = require("multer");
const Product = require("../models/Product");
const cloudinary = require("cloudinary").v2;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new Error("Only JPEG, PNG, and WebP images are allowed"),
        false
      );
    }
    cb(null, true);
  },
});

if (!process.env.CLOUDINARY_URL) {
  throw new Error("CLOUDINARY_URL environment variable is required");
}
cloudinary.config({ url: process.env.CLOUDINARY_URL });

// Define categories structure
const categories = {
  Fashion: {
    Men: [
      "Top Wear",
      "Bottom Wear",
      "Casual Shoes",
      "Watches",
      "Ethnic",
      "Sports Shoes",
      "Luggage",
      "Accessories",
      "Trimmers",
      "Essentials",
      "Men Grooming",
    ],
    Women: [
      "Dresses",
      "Top Wear",
      "Bottom Wear",
      "Footwear",
      "Beauty",
      "Luggage & Bags",
      "Ethnic",
      "Watches & Shades",
      "Accessories",
      "Essentials",
      "Jewelry",
      "Handbags"
    ],
    Beauty: ["Skincare", "Makeup", "Haircare", "Fragrances", "Swiss Beauty", "Sugar Pop Insights", "Renee"],
  },
  Gadgets: {
    Accessories: ["Phone Cases", "Chargers", "Headphones"],
    SmartDevices: ["Smartwatches", "Speakers", "Cameras"],
  },
  Electronics: {
    Audio: ["Headphones", "Speakers", "Earphones"],
    Computing: ["Laptops", "Desktops", "Monitors"]
  },
  Home: {
    Decor: ["Wall Art", "Rugs", "Lighting"],
    Kitchen: ["Appliances", "Utensils", "Cookware"]
  },
  Mobiles: {
    Smartphones: [
      "iPhone",
      "Samsung",
      "Xiaomi",
      "OnePlus",
      "Google Pixel",
      "Realme",
      "Redmi",
    ],
    FeaturePhones: ["Nokia", "JioPhone"],
    Tablets: ["iPad", "Samsung Galaxy Tab", "Lenovo Tab"],
    Accessories: [
      "Chargers",
      "Earphones",
      "Cases",
      "Screen Protectors",
      "Power Banks",
    ],
  },
  Appliances: {
    Small: ["Microwave", "Toaster", "Blender"],
    Large: ["Refrigerator", "Washing Machine", "Air Conditioner"]
  },
  Furniture: {
    Living: ["Sofas", "Tables", "Chairs"],
    Bedroom: ["Beds", "Wardrobes", "Mattresses"]
  },
  "Toys & Baby": [],
  Sports: [],
  Accessories: [],
  Slippers: [],
};

// Middleware to validate categories
const validateCategories = (req, res, next) => {
  const { category, subcategory, nestedCategory } = req.body || req.query;

  if (!category) {
    return res.status(400).json({ message: "Main category is required" });
  }

  if (!Object.keys(categories).includes(category)) {
    return res
      .status(400)
      .json({ message: `Invalid main category: ${category}` });
  }

  if (categories[category] && Object.keys(categories[category]).length > 0) {
    if (subcategory) {
      if (!Object.keys(categories[category]).includes(subcategory)) {
        return res
          .status(400)
          .json({
            message: `Invalid subcategory: ${subcategory} for category ${category}`,
          });
      }

      if (
        categories[category][subcategory] &&
        categories[category][subcategory].length > 0
      ) {
        if (!nestedCategory) {
          return res
            .status(400)
            .json({
              message: "Nested category is required for this subcategory",
            });
        }
        if (!categories[category][subcategory].includes(nestedCategory)) {
          return res
            .status(400)
            .json({
              message: `Invalid nested category: ${nestedCategory} for subcategory ${subcategory}`,
            });
        }
      } else if (nestedCategory) {
        return res
          .status(400)
          .json({
            message: `Nested category not allowed for subcategory ${subcategory}`,
          });
      }
    }
  } else if (subcategory || nestedCategory) {
    return res
      .status(400)
      .json({
        message: `Subcategory or nested category not allowed for category ${category}`,
      });
  }

  next();
};

const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ message: "Unauthorized: No token provided" });

  try {
    const jwt = require("jsonwebtoken");
    const Admin = require("../models/admin");
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.Jwt_Secret || 'ReB1GbhL1I');
    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin || !admin.isAdmin) {
      return res
        .status(403)
        .json({ message: "Forbidden: Admin role required" });
    }
    req.admin = admin;
    next();
  } catch (err) {
    res
      .status(401)
      .json({ message: "Unauthorized: Invalid token", error: err.message });
  }
};

const formatProductImage = (product) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5001";
  if (product.image) {
    if (!product.image.startsWith("http")) {
      product.image = product.image;
    }
  } else {
    product.image = `${baseUrl}/default-product.jpg`;
  }
  if (product.images && product.images.length > 0) {
    product.images = product.images.map((img) => {
      if (img && !img.startsWith("http")) {
        return img;
      }
      return img || `${baseUrl}/default-product.jpg`;
    });
  } else {
    product.images = [];
  }
  if (product.variants && product.variants.length > 0) {
    product.variants = product.variants.map((variant) => {
      if (variant.mainImage && !variant.mainImage.startsWith("http")) {
        variant.mainImage = variant.mainImage;
      }
      if (variant.additionalImages && variant.additionalImages.length > 0) {
        variant.additionalImages = variant.additionalImages.map((img) => {
          if (img && !img.startsWith("http")) {
            return img;
          }
          return img || `${baseUrl}/default-product.jpg`;
        });
      } else {
        variant.additionalImages = [];
      }
      return variant;
    });
  }
  return product;
};

// GET: Fetch all active products (public)
router.get("/products", async (req, res) => {
  try {
    const { mainCategory, subcategory, nestedCategory } = req.query;
    const query = { isActive: true };

    // Log the incoming query parameters for debugging
    console.log("Query Parameters:", {
      mainCategory,
      subcategory,
      nestedCategory,
    });

    // Filter by category, subcategory, and nestedCategory
    if (mainCategory) {
      query.category = { $regex: `^${mainCategory}$`, $options: "i" };
    }
    if (subcategory) {
      query.subcategory = { $regex: `^${subcategory}$`, $options: "i" };
    }
    if (nestedCategory) {
      query.nestedCategory = { $regex: `^${nestedCategory}$`, $options: "i" };
    }

    // Log the constructed query for debugging
    console.log("MongoDB Query:", query);

    const products = await Product.find(query);

    // Log the number of products found
    console.log("Products Found:", products.length);

    const formattedProducts = products.map((product) =>
      formatProductImage(product.toObject())
    );

    // Log the products returned (for debugging)
    console.log(
      "Formatted Products:",
      formattedProducts.map((p) => ({
        name: p.name,
        category: p.category,
        subcategory: p.subcategory,
        nestedCategory: p.nestedCategory,
      }))
    );

    res.json(formattedProducts);
  } catch (err) {
    console.error("Fetch Products Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// GET: Fetch products for admin with filters
router.get("/", verifyAdmin, async (req, res) => {
  try {
    const {
      search = "",
      category = "",
      subcategory = "",
      nestedCategory = "",
      priceMin = "",
      priceMax = "",
      stock = "",
      offer = "",
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (category) {
      query.category = { $regex: `^${category}$`, $options: "i" };
    }
    if (subcategory) {
      query.subcategory = { $regex: `^${subcategory}$`, $options: "i" };
    } else {
      query.subcategory = { $in: ["", null] };
    }
    if (nestedCategory) {
      query.nestedCategory = { $regex: `^${nestedCategory}$`, $options: "i" };
    } else {
      query.nestedCategory = { $in: ["", null] };
    }
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) {
        const min = parseFloat(priceMin);
        if (isNaN(min) || min < 0)
          return res.status(400).json({ message: "Invalid priceMin value" });
        query.price.$gte = min;
      }
      if (priceMax) {
        const max = parseFloat(priceMax);
        if (isNaN(max) || max < 0)
          return res.status(400).json({ message: "Invalid priceMax value" });
        query.price.$lte = max;
      }
    }
    if (stock) {
      if (stock === "inStock") query.stock = { $gt: 0 };
      if (stock === "outOfStock") query.stock = 0;
      if (stock === "lowStock") query.stock = { $gt: 0, $lte: 5 };
    }
    if (offer) {
      if (offer === "hasOffer") query.offer = { $ne: "", $ne: null };
      if (offer === "noOffer") query.offer = { $in: ["", null] };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ message: "Invalid page or limit value" });
    }
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(query);

   /*  const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const formattedProducts = products.map((product) =>
      formatProductImage(product.toObject())
    );
    res.json({
      products: formattedProducts,
      totalPages: Math.ceil(totalProducts / limitNum),
      currentPage: pageNum,
    }); */

const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const formattedProducts = products.map((product) => {
      let subcategory = product.subcategory || "";
      let nestedCategory = product.nestedCategory || "";

      if (
        product.category &&
        categories[product.category] &&
        Object.keys(categories[product.category]).length > 0 &&
        subcategory &&
        !Object.keys(categories[product.category]).includes(subcategory)
      ) {
        console.warn(
          `Invalid subcategory for product ${product._id} (category: ${product.category}, received: ${subcategory}). Defaulting to "".`
        );
        subcategory = "";
      }

      if (
        product.category &&
        subcategory &&
        categories[product.category][subcategory] &&
        categories[product.category][subcategory].length > 0 &&
        nestedCategory &&
        !categories[product.category][subcategory].includes(nestedCategory)
      ) {
        console.warn(
          `Invalid nested category for product ${product._id} (subcategory: ${subcategory}, received: ${nestedCategory}). Defaulting to "".`
        );
        nestedCategory = "";
      }

      return formatProductImage({
        ...product.toObject(),
        subcategory,
        nestedCategory,
      });
    });

    res.json({
      products: formattedProducts,
      totalPages: Math.ceil(totalProducts / limitNum),
      currentPage: pageNum,
    });







  } catch (err) {
    console.error("Fetch Products Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST: Add a new product
router.post(
  "/",
  verifyAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  validateCategories,
  async (req, res) => {
    const {
      name,
      price,
      stock,
      category,
      subcategory,
      nestedCategory,
      description,
      offer,
      sizes,
      isActive,
      featured,
      brand,
      seller,
      specifications,
      warranty,
      dealTag,
      weight,
      weightUnit,
      model,
      variants,
    } = req.body;

    try {
      if (!req.files["image"]) {
        return res.status(400).json({ message: "Main image is required" });
      }

      const priceNum = parseFloat(price);
      const stockNum = parseInt(stock);
      if (isNaN(priceNum) || priceNum <= 0) {
        return res
          .status(400)
          .json({ message: "Price must be a positive number" });
      }
      if (isNaN(stockNum) || stockNum < 0) {
        return res
          .status(400)
          .json({ message: "Stock must be a non-negative integer" });
      }

      let parsedSizes = [];
      if (sizes) {
        try {
          parsedSizes = JSON.parse(sizes);
          if (!Array.isArray(parsedSizes)) {
            return res.status(400).json({ message: "Sizes must be an array" });
          }
        } catch (err) {
          return res.status(400).json({ message: "Invalid sizes format" });
        }
      }

      let parsedSpecifications = {};
      if (specifications) {
        try {
          parsedSpecifications = JSON.parse(specifications);
          if (
            typeof parsedSpecifications !== "object" ||
            Array.isArray(parsedSpecifications)
          ) {
            return res 
              .status(400)
              .json({ message: "Specifications must be an object" });
          }
        } catch (err) {
          return res
            .status(400)
            .json({ message: "Invalid specifications format" });
        }
      }

      let parsedVariants = [];
      if (variants) {
        try {
          parsedVariants = JSON.parse(variants);
          if (!Array.isArray(parsedVariants)) {
            return res
              .status(400)
              .json({ message: "Variants must be an array" });
          }
        } catch (err) {
          return res.status(400).json({ message: "Invalid variants format" });
        }
      }

      const mainImageResult = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream({ resource_type: "image" }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(req.files["image"][0].buffer);
      });
      const image = mainImageResult.secure_url;

      const images = req.files["images"]
        ? await Promise.all(
            req.files["images"].map(async (file) => {
              const result = await new Promise((resolve, reject) => {
                cloudinary.uploader
                  .upload_stream(
                    { resource_type: "image" },
                    (error, result) => {
                      if (error) reject(error);
                      else resolve(result);
                    }
                  )
                  .end(file.buffer);
              });
              return result.secure_url;
            })
          )
        : [];

      const product = new Product({
        name,
        price: priceNum,
        stock: stockNum,
        category,
        subcategory: subcategory || "",
        nestedCategory: nestedCategory || "",
        description,
        offer: offer || "",
        sizes: parsedSizes,
        seller: seller || "",
        specifications: parsedSpecifications,
        warranty: warranty || "",
        isActive: isActive === "true" || isActive === true,
        featured: featured === "true" || featured === true,
        dealTag: dealTag || "",
        brand: brand || "",
        weight:
          weight && !isNaN(parseFloat(weight)) ? parseFloat(weight) : null,
        weightUnit: weightUnit || "kg",
        model: model || "",
        image,
        images,
        variants: parsedVariants,
      });

      const savedProduct = await product.save();
      const formattedProduct = formatProductImage(savedProduct.toObject());
      res
        .status(201)
        .json({
          message: "Product added successfully",
          product: formattedProduct,
        });
    } catch (err) {
      console.error("Add Product Error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// PUT: Update a product
router.put(
  "/:id",
  verifyAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
    { name: "variantMainImage", maxCount: 1 },
    { name: "variantImages", maxCount: 10 },
  ]),
  validateCategories,
  async (req, res) => {
    const {
      name,
      price,
      stock,
      category,
      subcategory,
      nestedCategory,
      description,
      offer,
      sizes,
      isActive,
      featured,
      brand,
      seller,
      specifications,
      warranty,
      dealTag,
      weight,
      weightUnit,
      model,
      existingImages,
      variants,
    } = req.body;

    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const priceNum = price ? parseFloat(price) : product.price;
      const stockNum = stock ? parseInt(stock) : product.stock;
      if (isNaN(priceNum) || priceNum <= 0) {
        return res
          .status(400)
          .json({ message: "Price must be a positive number" });
      }
      if (isNaN(stockNum) || stockNum < 0) {
        return res
          .status(400)
          .json({ message: "Stock must be a non-negative integer" });
      }

      let parsedSizes = product.sizes;
      if (sizes) {
        try {
          parsedSizes = JSON.parse(sizes);
          if (!Array.isArray(parsedSizes)) {
            return res.status(400).json({ message: "Sizes must be an array" });
          }
        } catch (err) {
          return res.status(400).json({ message: "Invalid sizes format" });
        }
      }

      let parsedSpecifications = product.specifications;
      if (specifications) {
        try {
          parsedSpecifications = JSON.parse(specifications);
          if (
            typeof parsedSpecifications !== "object" ||
            Array.isArray(parsedSpecifications)
          ) {
            return res
              .status(400)
              .json({ message: "Specifications must be an object" });
          }
        } catch (err) {
          return res
            .status(400)
            .json({ message: "Invalid specifications format" });
        }
      }

      let parsedVariants = product.variants || [];
      if (variants) {
        try {
          parsedVariants = JSON.parse(variants);
          if (!Array.isArray(parsedVariants)) {
            return res
              .status(400)
              .json({ message: "Variants must be an array" });
          }
        } catch (err) {
          return res.status(400).json({ message: "Invalid variants format" });
        }
      }

      let image = product.image;
      if (req.files["image"]) {
        const mainImageResult = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream({ resource_type: "image" }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            })
            .end(req.files["image"][0].buffer);
        });
        image = mainImageResult.secure_url;
      }

      let updatedImages = [...product.images];
      if (existingImages) {
        try {
          const retainedImages = JSON.parse(existingImages);
          updatedImages =
            retainedImages.length > 0 ? retainedImages : product.images;
        } catch (parseErr) {
          console.error("Error parsing existingImages:", parseErr.message);
          updatedImages = [...product.images];
        }
      }
      if (req.files["images"]) {
        const newImages = await Promise.all(
          req.files["images"].map(async (file) => {
            const result = await new Promise((resolve, reject) => {
              cloudinary.uploader
                .upload_stream({ resource_type: "image" }, (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                })
                .end(file.buffer);
            });
            return result.secure_url;
          })
        );
        updatedImages = [...updatedImages, ...newImages];
      }

      if (req.files["variantMainImage"] || req.files["variantImages"]) {
        const newVariant = {
          variantId: Date.now().toString(),
          specifications: parsedSpecifications || {},
        };

        if (req.files["variantMainImage"]) {
          const variantMainImageResult = await new Promise(
            (resolve, reject) => {
              cloudinary.uploader
                .upload_stream({ resource_type: "image" }, (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                })
                .end(req.files["variantMainImage"][0].buffer);
            }
          );
          newVariant.mainImage = variantMainImageResult.secure_url;
        }

        if (req.files["variantImages"]) {
          const variantImages = await Promise.all(
            req.files["variantImages"].map(async (file) => {
              const result = await new Promise((resolve, reject) => {
                cloudinary.uploader
                  .upload_stream(
                    { resource_type: "image" },
                    (error, result) => {
                      if (error) reject(error);
                      else resolve(result);
                    }
                  )
                  .end(file.buffer);
              });
              return result.secure_url;
            })
          );
          newVariant.additionalImages = variantImages;
        }

        parsedVariants.push(newVariant);
      }

      product.name = name || product.name;
      product.price = priceNum;
      product.stock = stockNum;
      product.category = category || product.category;
      product.subcategory =
        subcategory !== undefined ? subcategory : product.subcategory;
      product.nestedCategory =
        nestedCategory !== undefined ? nestedCategory : product.nestedCategory;
      product.description =
        description !== undefined && description !== ""
          ? description
          : product.description;
      product.offer = offer !== undefined ? offer : product.offer;
      product.sizes = parsedSizes;
      product.seller = seller !== undefined ? seller : product.seller;
      product.specifications = parsedSpecifications;
      product.warranty = warranty !== undefined ? warranty : product.warranty;
      product.isActive =
        isActive !== undefined
          ? isActive === "true" || isActive === true
          : product.isActive;
      product.featured =
        featured !== undefined
          ? featured === "true" || featured === true
          : product.featured;
      product.dealTag = dealTag !== undefined ? dealTag : product.dealTag;
      product.brand =
        brand !== undefined && brand !== "" ? brand : product.brand;
      product.weight =
        weight !== undefined && weight !== "" ? parseFloat(weight) : product.weight;
      product.weightUnit = weightUnit || product.weightUnit || "kg";
      product.model =
        model !== undefined && model !== "" ? model : product.model;
      product.image = image;
      product.images = updatedImages;
      product.variants = parsedVariants;

      const updatedProduct = await product.save();
      const formattedProduct = formatProductImage(updatedProduct.toObject());
      res.json({
        message: "Product updated successfully",
        product: formattedProduct,
      });
    } catch (err) {
      console.error("Update Product Error:", err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// DELETE: Delete a product
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) {
    console.error("Delete Product Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// PUT: Toggle product status
router.put("/:id/toggle-status", verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.isActive = !product.isActive;
    const updatedProduct = await product.save();
    const formattedProduct = formatProductImage(updatedProduct.toObject());
    res.json({
      message: "Product status updated successfully",
      product: formattedProduct,
    });
  } catch (err) {
    console.error("Toggle Product Status Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;

















































///main
/* const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../models/Product');
const cloudinary = require('cloudinary').v2;

const storage = multer.memoryStorage(); // Use memory storage for Cloudinary upload
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
    }
    cb(null, true);
  },
});

// Configure Cloudinary using only CLOUDINARY_URL
if (!process.env.CLOUDINARY_URL) {
  throw new Error('CLOUDINARY_URL environment variable is required');
}
console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL);
cloudinary.config({ url: process.env.CLOUDINARY_URL });

// Verify admin middleware
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized: No token provided' });

  try {
    const jwt = require('jsonwebtoken');
    const Admin = require('../models/admin');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.Jwt_Secret || 'ReB1GbhL1I');
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: Admin role required' });
    }
    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized: Invalid token', error: err.message });
  }
};

// Format product image URL
const formatProductImage = (product) => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:5001';
  if (product.image) {
    if (!product.image.startsWith('http')) {
      product.image = product.image; // Cloudinary URLs are already full URLs
    }
  } else {
    product.image = `${baseUrl}/default-product.jpg`;
  }
  if (product.images && product.images.length > 0) {
    product.images = product.images.map((img) => {
      if (img && !img.startsWith('http')) {
        return img; // Cloudinary URLs are already full URLs
      }
      return img || `${baseUrl}/default-product.jpg`;
    });
  } else {
    product.images = [];
  }
  return product;
};

// GET: Fetch all active products (public)
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const formattedProducts = products.map((product) => formatProductImage(product.toObject()));
    res.json(formattedProducts);
  } catch (err) {
    console.error('Fetch Products Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET: Fetch products for admin with filters
router.get('/', verifyAdmin, async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      priceMin = '',
      priceMax = '',
      stock = '',
      offer = '',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) {
        const min = parseFloat(priceMin);
        if (isNaN(min) || min < 0) return res.status(400).json({ message: 'Invalid priceMin value' });
        query.price.$gte = min;
      }
      if (priceMax) {
        const max = parseFloat(priceMax);
        if (isNaN(max) || max < 0) return res.status(400).json({ message: 'Invalid priceMax value' });
        query.price.$lte = max;
      }
    }
    if (stock) {
      if (stock === 'inStock') query.stock = { $gt: 0 };
      if (stock === 'outOfStock') query.stock = 0;
      if (stock === 'lowStock') query.stock = { $gt: 0, $lte: 5 };
    }
    if (offer) {
      if (offer === 'hasOffer') query.offer = { $ne: '', $ne: null };
      if (offer === 'noOffer') query.offer = { $in: ['', null] };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ message: 'Invalid page or limit value' });
    }
    const skip = (pageNum - 1) * limitNum;

    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const formattedProducts = products.map((product) => formatProductImage(product.toObject()));
    res.json({
      products: formattedProducts,
      totalPages: Math.ceil(totalProducts / limitNum),
      currentPage: pageNum,
    });
  } catch (err) {
    console.error('Fetch Products Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST: Add a new product
router.post('/', verifyAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]), async (req, res) => {
  const {
    name, price, stock, category, description, offer, sizes, isActive,
    featured, brand, weight, weightUnit, model,
  } = req.body;

  try {
    if (!req.files['image']) {
      return res.status(400).json({ message: 'Main image is required' });
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ message: 'Stock must be a non-negative integer' });
    }

    let parsedSizes = [];
    if (sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
        if (!Array.isArray(parsedSizes)) {
          return res.status(400).json({ message: 'Sizes must be an array' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid sizes format' });
      }
    }

    // Upload main image to Cloudinary
    const mainImageResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }).end(req.files['image'][0].buffer);
    });
    const image = mainImageResult.secure_url;

    // Upload additional images to Cloudinary
    const images = req.files['images'] ? await Promise.all(
      req.files['images'].map(async (file) => {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }).end(file.buffer);
        });
        return result.secure_url;
      })
    ) : [];

    const product = new Product({
      name,
      price: priceNum,
      stock: stockNum,
      category,
      description,
      offer: offer || '',
      sizes: parsedSizes,
      isActive: isActive === 'true' || isActive === true,
      featured: featured === 'true' || featured === true,
      brand: brand || '',
      weight: weight && !isNaN(parseFloat(weight)) ? parseFloat(weight) : null,
      weightUnit: weightUnit || 'kg',
      model: model || '',
      image,
      images,
    });

    const savedProduct = await product.save();
    const formattedProduct = formatProductImage(savedProduct.toObject());
    res.status(201).json({ message: 'Product added successfully', product: formattedProduct });
  } catch (err) {
    console.error('Add Product Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT: Update a product
router.put('/:id', verifyAdmin, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]), async (req, res) => {
  const {
    name, price, stock, category, description, offer, sizes, isActive,
    featured, brand, weight, weightUnit, model, existingImages,
  } = req.body;

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const priceNum = price ? parseFloat(price) : product.price;
    const stockNum = stock ? parseInt(stock) : product.stock;
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }
    if (isNaN(stockNum) || stockNum < 0) {
      return res.status(400).json({ message: 'Stock must be a non-negative integer' });
    }

    let parsedSizes = product.sizes;
    if (sizes) {
      try {
        parsedSizes = JSON.parse(sizes);
        if (!Array.isArray(parsedSizes)) {
          return res.status(400).json({ message: 'Sizes must be an array' });
        }
      } catch (err) {
        return res.status(400).json({ message: 'Invalid sizes format' });
      }
    }

    let image = product.image;
    if (req.files['image']) {
      const mainImageResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(req.files['image'][0].buffer);
      });
      image = mainImageResult.secure_url;
    }

    let updatedImages = [...product.images];
    console.log('Received existingImages:', existingImages);
    if (existingImages) {
      try {
        const retainedImages = JSON.parse(existingImages);
        console.log('Parsed retainedImages:', retainedImages);
        updatedImages = retainedImages.length > 0 ? retainedImages : product.images;
      } catch (parseErr) {
        console.error('Error parsing existingImages:', parseErr.message);
        updatedImages = [...product.images];
      }
    }
    if (req.files['images']) {
      const newImages = await Promise.all(
        req.files['images'].map(async (file) => {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }).end(file.buffer);
          });
          return result.secure_url;
        })
      );
      updatedImages = [...updatedImages, ...newImages];
    }
    console.log('Final updatedImages:', updatedImages);

    product.name = name || product.name;
    product.price = priceNum;
    product.stock = stockNum;
    product.category = category || product.category;
    product.description = description !== undefined && description !== '' ? description : product.description;
    product.offer = offer !== undefined ? offer : product.offer;
    product.sizes = parsedSizes;
    product.isActive = isActive !== undefined ? (isActive === 'true' || isActive === true) : product.isActive;
    product.featured = featured !== undefined ? (featured === 'true' || featured === true) : product.featured;
    product.brand = brand !== undefined && brand !== '' ? brand : product.brand;
    product.weight = weight !== undefined && weight !== '' ? parseFloat(weight) : product.weight;
    product.weightUnit = weightUnit || product.weightUnit || 'kg';
    product.model = model !== undefined && model !== '' ? model : product.model;
    product.image = image;
    product.images = updatedImages;

    const updatedProduct = await product.save();
    const formattedProduct = formatProductImage(updatedProduct.toObject());
    res.json({ message: 'Product updated successfully', product: formattedProduct });
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE: Delete a product
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // No local file cleanup needed since images are on Cloudinary
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete Product Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT: Toggle product status
router.put('/:id/toggle-status', verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isActive = !product.isActive;
    const updatedProduct = await product.save();
    const formattedProduct = formatProductImage(updatedProduct.toObject());
    res.json({ message: 'Product status updated successfully', product: formattedProduct });
  } catch (err) {
    console.error('Toggle Product Status Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router; */
