import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { CSVLink } from "react-csv";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "../styles/ProductManagement.css";
let Papa;
try {
  Papa = require("papaparse");
} catch (e) {
  console.warn("Papa Parse not found. Bulk upload will be disabled.", e);
  Papa = null;
}

function ProductManagement() {
  const [totalPages, setTotalPages] = useState(1);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    discountedPrice: "",
    sku: "",
    category: "",
    subcategory: "",
    nestedCategory: "",
    stock: "",
    description: "",
    mainImage: null,
    currentMainImage: null,
    existingImages: [],
    newImages: [],
    offer: "",
    sizes: [],
    packOf: "",
    trimmingRange: "",
    bladeMaterial: "",
    seller: "",
    specifications: {},
    warranty: "",
    isActive: true,
    featured: false,
    dealTag: "",
    brand: "",
    weight: "",
    model: "",
    variants: [],
  });
  const [variantFormData, setVariantFormData] = useState(null);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSubcategory, setFilterSubcategory] = useState("");
  const [filterNestedCategory, setFilterNestedCategory] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [filterStock, setFilterStock] = useState("");
  const [filterOffer, setFilterOffer] = useState("");
  const [previewModal, setPreviewModal] = useState(null);
  const [variantModal, setVariantModal] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(true);
  const [selectedImage, setSelectedImage] = useState({});
  const [selectedVariant, setSelectedVariant] = useState({});
  const productsPerPage = 10;
  const navigate = useNavigate();

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
      ],
      Beauty: ["Swiss Beauty", "Sugar Pop Insights", "Renee"],
    },
    Gadgets: {
      Accessories: ["Phone Cases", "Chargers", "Headphones"],
      SmartDevices: ["Smartwatches", "Speakers", "Cameras"],
    },
    Furniture: {
      Living: ["Sofas", "Tables", "Chairs"],
      Bedroom: ["Beds", "Wardrobes", "Mattresses"],
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
      Large: ["Refrigerator", "Washing Machine", "Air Conditioner"],
    },
    Beauty: [],
    Home: [],
    "Toys & Baby": [],
    Sports: [],
  };

  const sizeOptionsMap = {
    "Top Wear": ["S", "M", "L", "XL", "XXL"],
    Dresses: ["S", "M", "L", "XL", "XXL"],
    "Bottom Wear": ["28", "30", "32", "34", "36"],
    "Casual Shoes": ["6", "7", "8", "9", "10", "11", "12"],
    "Sports Shoes": ["6", "7", "8", "9", "10", "11", "12"],
    Footwear: ["6", "7", "8", "9", "10"],
    Essentials: ["Free", "XS", "S", "M", "L"],
    Luggage: ["55cm (Small)", "65cm (Medium)", "75cm (Large)"],
    "Luggage & Bags": ["55cm (Small)", "65cm (Medium)", "75cm (Large)"],
    default: [],
  };

  const bladeMaterialOptions = ["Ceramic", "Stainless Steel", "Titanium"];
  const dealTagOptions = ["Hot Deals", "Low Price Drop", ""];
  const packOfOptions = ["1", "2", "3"];

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 50);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (err) {
      console.error("Error decoding token:", err);
      return true;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      toast.error("Session expired. Please log in again.");
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      fetchProducts(true);
    }
  }, [navigate]);

  useEffect(() => {
    setCurrentPage(1);
    setShouldFetch(true);
  }, [
    debouncedSearchQuery,
    filterCategory,
    filterSubcategory,
    filterNestedCategory,
    filterPriceMin,
    filterPriceMax,
    filterStock,
    filterOffer,
  ]);

  useEffect(() => {
    if (shouldFetch) {
      fetchProducts(true);
    }
  }, [currentPage, shouldFetch]);

  useEffect(() => {
    const nestedCat = formData.nestedCategory || "default";
    setSizeOptions(sizeOptionsMap[nestedCat] || sizeOptionsMap.default);
    setFormData((prev) => ({ ...prev, sizes: [] }));
  }, [formData.nestedCategory]);

  useEffect(() => {
    return () => {
      if (
        formData.currentMainImage &&
        typeof formData.currentMainImage !== "string"
      ) {
        URL.revokeObjectURL(formData.currentMainImage);
      }
      formData.newImages.forEach((image) => {
        if (typeof image.preview === "string")
          URL.revokeObjectURL(image.preview);
      });
    };
  }, [formData.currentMainImage, formData.newImages]);

  const fetchProducts = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        throw new Error("Session expired. Please log in again.");
      }

      const params = new URLSearchParams({
        search: debouncedSearchQuery,
        category: filterCategory,
        subcategory: filterSubcategory,
        nestedCategory: filterNestedCategory,
        priceMin: filterPriceMin,
        priceMax: filterPriceMax,
        stock: filterStock,
        offer: filterOffer,
        page: currentPage,
        limit: productsPerPage,
        sort: "-createdAt",
      });

      const res = await axios.get(
        `https://backend-ps76.onrender.com/api/admin/products?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const productData = res.data.products || res.data || [];
      const initializedProducts = Array.isArray(productData)
        ? productData.map((product) => {
            // Use values from the API response, fall back to empty strings if undefined
            let subcategory = product.subcategory || "";
            let nestedCategory = product.nestedCategory || "";

            // Only apply defaulting if the category structure exists and the field is invalid
            if (
              product.category &&
              categories[product.category] &&
              Object.keys(categories[product.category]).length > 0 &&
              subcategory &&
              (!subcategory || !Object.keys(categories[product.category]).includes(subcategory))
            ) {
              console.warn(
                `Invalid or missing subcategory for product ${product._id} (category: ${product.category}). Defaulting to first available subcategory.`
              );
              subcategory = Object.keys(categories[product.category])[0] || "";
            }

            if (
              product.category &&
              subcategory &&
              categories[product.category] &&
              categories[product.category][subcategory] &&
              categories[product.category][subcategory].length > 0 &&
              nestedCategory &&
              (!nestedCategory || !categories[product.category][subcategory].includes(nestedCategory))
            ) {
              console.warn(
                `Invalid or missing nested category for product ${product._id} (category: ${product.category}, subcategory: ${subcategory}). Defaulting to first available nested category. Received: ${nestedCategory}`
              );
              nestedCategory = categories[product.category][subcategory][0] || "";
            }

            return {
              ...product,
              selected: product.selected || false,
              image: product.image || "/default-product.jpg",
              images: product.images || [],
              specifications: product.specifications || {},
              variants: product.variants || [],
              subcategory,
              nestedCategory,
            };
          })
        : [];

      setProducts(initializedProducts);
      setTotalPages(
        res.data.totalPages ||
          Math.ceil((res.data.total || productData.length) / productsPerPage)
      );
      setShouldFetch(false);
    } catch (err) {
      console.error(
        "Error fetching products:",
        err.response ? err.response.data : err.message
      );
      if (err.response?.status === 401) {
        toast.error("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error(
          err.response?.data?.message ||
            "Failed to load products. Check server or token."
        );
        setProducts([]);
        setTotalPages(1);
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleVariantInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVariantFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const maxSize = 5 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (name === "mainImage") {
      const file = files[0];
      if (!file) return;
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a valid image (JPEG, PNG, or WebP)");
        return;
      }
      if (file.size > maxSize) {
        toast.error("Image size should not exceed 5MB");
        return;
      }
      setFormData((prev) => {
        if (
          prev.currentMainImage &&
          typeof prev.currentMainImage !== "string"
        ) {
          URL.revokeObjectURL(prev.currentMainImage);
        }
        const imageUrl = file ? URL.createObjectURL(file) : null;
        return { ...prev, mainImage: file, currentMainImage: imageUrl };
      });
    } else if (name === "images") {
      const validFiles = Array.from(files).filter((file) => {
        if (!allowedTypes.includes(file.type)) {
          toast.error(
            `Invalid file type for ${file.name}. Please upload JPEG, PNG, or WebP.`
          );
          return false;
        }
        if (file.size > maxSize) {
          toast.error(`File ${file.name} exceeds 5MB limit.`);
          return false;
        }
        return true;
      });

      const newImagesWithPreview = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setFormData((prev) => ({
        ...prev,
        newImages: [...prev.newImages, ...newImagesWithPreview],
      }));
    } else if (name === "variantMainImage") {
      const file = files[0];
      if (!file) return;
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a valid image (JPEG, PNG, or WebP)");
        return;
      }
      if (file.size > maxSize) {
        toast.error("Image size should not exceed 5MB");
        return;
      }
      setVariantFormData((prev) => {
        if (
          prev.currentMainImage &&
          typeof prev.currentMainImage !== "string"
        ) {
          URL.revokeObjectURL(prev.currentMainImage);
        }
        const imageUrl = file ? URL.createObjectURL(file) : null;
        return { ...prev, mainImage: file, currentMainImage: imageUrl };
      });
    } else if (name === "variantImages") {
      const validFiles = Array.from(files).filter((file) => {
        if (!allowedTypes.includes(file.type)) {
          toast.error(
            `Invalid file type for ${file.name}. Please upload JPEG, PNG, or WebP.`
          );
          return false;
        }
        if (file.size > maxSize) {
          toast.error(`File ${file.name} exceeds 5MB limit.`);
          return false;
        }
        return true;
      });

      const newImagesWithPreview = validFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      setVariantFormData((prev) => ({
        ...prev,
        newImages: [...(prev.newImages || []), ...newImagesWithPreview],
      }));
    } else if (name === "bulkUpload") {
      const file = files[0];
      if (!file) return;
      if (!Papa) {
        toast.error(
          "Bulk upload feature is unavailable. Please install Papa Parse library."
        );
        return;
      }
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const bulkProducts = results.data.map((row) => ({
            name: row.name || "",
            price: parseFloat(row.price) || "",
            discountedPrice: parseFloat(row.discountedPrice) || "",
            sku: row.sku || "",
            category: row.category || "",
            subcategory: row.subcategory || "",
            nestedCategory: row.nestedCategory || "",
            stock: parseInt(row.stock) || "",
            description: row.description || "",
            offer: row.offer || "",
            sizes: row.sizes ? row.sizes.split(",").map((s) => s.trim()) : [],
            packOf: row.packOf || "",
            seller: row.seller || "",
            warranty: row.warranty || "",
            isActive: row.isActive === "Yes",
            featured: row.featured === "Yes",
            dealTag: row.dealTag || "",
            brand: row.brand || "",
            weight: row.weight || "",
            model: row.model || "",
          }));

          try {
            const token = localStorage.getItem("token");
            await Promise.all(
              bulkProducts.map((product) =>
                axios.post(
                  "https://backend-ps76.onrender.com/api/admin/products",
                  product,
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                )
              )
            );
            toast.success("Bulk products uploaded successfully!");
            setShouldFetch(true);
          } catch (err) {
            toast.error("Failed to upload bulk products.");
            console.error(err);
          }
        },
        error: (err) => {
          toast.error("Failed to parse CSV file.");
          console.error(err);
        },
      });
    }
  };

  const handleSizeChange = (size) => {
    setFormData((prev) => {
      const sizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes };
    });
  };

  const handleSpecificationChange = (section, key, value, isKey = false) => {
    setFormData((prev) => {
      const specs = { ...prev.specifications };
      if (!specs[section]) specs[section] = {};
      if (isKey) {
        const oldValue = specs[section][key];
        delete specs[section][key];
        specs[section][value] = oldValue || "";
      } else {
        specs[section][key] = value;
      }
      return { ...prev, specifications: specs };
    });
  };

  const handleVariantSpecificationChange = (
    section,
    key,
    value,
    isKey = false
  ) => {
    setVariantFormData((prev) => {
      const specs = { ...prev.specifications };
      if (!specs[section]) specs[section] = {};
      if (isKey) {
        const oldValue = specs[section][key];
        delete specs[section][key];
        specs[section][value] = oldValue || "";
      } else {
        specs[section][key] = value;
      }
      return { ...prev, specifications: specs };
    });
  };

  const handleSpecificationSectionNameChange = (
    oldSectionName,
    newSectionName
  ) => {
    if (!newSectionName || newSectionName === oldSectionName) return;
    setFormData((prev) => {
      const specs = { ...prev.specifications };
      const sectionData = { ...specs[oldSectionName] };
      delete specs[oldSectionName];
      specs[newSectionName] = sectionData;
      return { ...prev, specifications: specs };
    });
  };

  const handleVariantSpecificationSectionNameChange = (
    oldSectionName,
    newSectionName
  ) => {
    if (!newSectionName || newSectionName === oldSectionName) return;
    setVariantFormData((prev) => {
      const specs = { ...prev.specifications };
      const sectionData = { ...specs[oldSectionName] };
      delete specs[oldSectionName];
      specs[newSectionName] = sectionData;
      return { ...prev, specifications: specs };
    });
  };

  const addSpecificationField = (section) => {
    const key = prompt("Enter specification key (e.g., Color):");
    if (key) {
      setFormData((prev) => {
        const specs = { ...prev.specifications };
        if (!specs[section]) specs[section] = {};
        specs[section][key] = "";
        return { ...prev, specifications: specs };
      });
    }
  };

  const addVariantSpecificationField = (section) => {
    const key = prompt("Enter specification key (e.g., Color):");
    if (key) {
      setVariantFormData((prev) => {
        const specs = { ...prev.specifications };
        if (!specs[section]) specs[section] = {};
        specs[section][key] = "";
        return { ...prev, specifications: specs };
      });
    }
  };

  const removeSpecificationField = (section, key) => {
    setFormData((prev) => {
      const specs = { ...prev.specifications };
      if (specs[section]) {
        delete specs[section][key];
        if (Object.keys(specs[section]).length === 0) delete specs[section];
      }
      return { ...prev, specifications: specs };
    });
  };

  const removeVariantSpecificationField = (section, key) => {
    setVariantFormData((prev) => {
      const specs = { ...prev.specifications };
      if (specs[section]) {
        delete specs[section][key];
        if (Object.keys(specs[section]).length === 0) delete specs[section];
      }
      return { ...prev, specifications: specs };
    });
  };

  const addSpecificationSection = () => {
    const sectionName = prompt(
      "Enter specification section name (e.g., General, Display):"
    );
    if (sectionName) {
      setFormData((prev) => ({
        ...prev,
        specifications: { ...prev.specifications, [sectionName]: {} },
      }));
    }
  };

  const addVariantSpecificationSection = () => {
    const sectionName = prompt(
      "Enter specification section name (e.g., General, Display):"
    );
    if (sectionName) {
      setVariantFormData((prev) => ({
        ...prev,
        specifications: { ...prev.specifications, [sectionName]: {} },
      }));
    }
  };

  const resetForm = () => {
    if (
      formData.currentMainImage &&
      typeof formData.currentMainImage !== "string"
    ) {
      URL.revokeObjectURL(formData.currentMainImage);
    }
    formData.newImages.forEach((image) => {
      if (image.preview) URL.revokeObjectURL(image.preview);
    });

    setFormData({
      name: "",
      price: "",
      discountedPrice: "",
      sku: "",
      category: "",
      subcategory: "",
      nestedCategory: "",
      stock: "",
      description: "",
      mainImage: null,
      currentMainImage: null,
      existingImages: [],
      newImages: [],
      offer: "",
      sizes: [],
      packOf: "",
      trimmingRange: "",
      bladeMaterial: "",
      seller: "",
      specifications: {},
      warranty: "",
      isActive: true,
      featured: false,
      dealTag: "",
      brand: "",
      weight: "",
      model: "",
      variants: [],
    });
    setEditingProductId(null);
    setSelectedImage({});
    const mainImageInput = document.getElementById("mainImageInput");
    const additionalImagesInput = document.getElementById(
      "additionalImagesInput"
    );
    if (mainImageInput) mainImageInput.value = null;
    if (additionalImagesInput) additionalImagesInput.value = null;
    setShowForm(false);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setDebouncedSearchQuery("");
    setFilterCategory("");
    setFilterSubcategory("");
    setFilterNestedCategory("");
    setFilterPriceMin("");
    setFilterPriceMax("");
    setFilterStock("");
    setFilterOffer("");
    setCurrentPage(1);
    setShouldFetch(true);
    toast.success("Filters reset successfully!");
  };

  const validateForm = () => {
    if (!formData.name) {
      toast.error("Product name is required");
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error("Price must be a positive number");
      return false;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      toast.error("Stock must be a non-negative integer");
      return false;
    }
    if (!formData.category) {
      toast.error("Main category is required");
      return false;
    }
    if (
      formData.category &&
      categories[formData.category] &&
      Object.keys(categories[formData.category]).length > 0 &&
      !formData.subcategory
    ) {
      toast.error("Subcategory is required");
      return false;
    }
    if (
      formData.category &&
      formData.subcategory &&
      categories[formData.category][formData.subcategory] &&
      !formData.nestedCategory
    ) {
      toast.error("Nested category is required");
      return false;
    }
    if (
      !editingProductId &&
      !formData.mainImage &&
      formData.existingImages.length === 0
    ) {
      toast.error(
        "Main image or existing images are required when adding a new product"
      );
      return false;
    }
    return true;
  };

  const validateVariantForm = () => {
    if (!variantFormData) {
      toast.error("Variant form data is missing");
      return false;
    }
    if (
      !variantFormData.mainImage &&
      !variantFormData.currentMainImage &&
      variantFormData.newImages.length === 0
    ) {
      toast.error("At least one image is required for the variant");
      return false;
    }
    if (Object.keys(variantFormData.specifications || {}).length === 0) {
      toast.error("At least one specification is required for the variant");
      return false;
    }
    return true;
  };

 /*  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    const form = new FormData();
    form.append("name", formData.name);
    form.append("price", formData.price);
    form.append("discountedPrice", formData.discountedPrice || "");
    form.append("sku", formData.sku || "");
    form.append("category", formData.category);
    form.append("subcategory", formData.subcategory);
    form.append("nestedCategory", formData.nestedCategory);
    form.append("stock", formData.stock);
    form.append("description", formData.description || "");
    form.append("offer", formData.offer || "");
    form.append("sizes", JSON.stringify(formData.sizes));
    form.append("packOf", formData.packOf || "");
    form.append("seller", formData.seller || "");

    const specs = { ...formData.specifications };
    if (formData.nestedCategory === "Trimmers") {
      if (formData.trimmingRange) {
        if (!specs["Trimming Range"]) specs["Trimming Range"] = {};
        specs["Trimming Range"]["Range"] = formData.trimmingRange;
      }
      if (formData.bladeMaterial) {
        if (!specs["Blade Material"]) specs["Blade Material"] = {};
        specs["Blade Material"]["Material"] = formData.bladeMaterial;
      }
    }
    form.append("specifications", JSON.stringify(specs));

    form.append("warranty", formData.warranty || "");
    form.append("isActive", formData.isActive);
    form.append("featured", formData.featured);
    form.append("dealTag", formData.dealTag || "");
    form.append("brand", formData.brand || "");

    let weightValue = formData.weight.trim();
    if (weightValue) {
      if (weightValue.toLowerCase().endsWith("g")) {
        weightValue = parseFloat(weightValue.replace(/g/i, "")) / 1000;
      } else if (weightValue.toLowerCase().endsWith("kg")) {
        weightValue = parseFloat(weightValue.replace(/kg/i, ""));
      } else {
        weightValue = parseFloat(weightValue);
      }
      if (isNaN(weightValue) || weightValue <= 0) {
        toast.error(
          'Invalid weight format. Use numbers with "kg" or "g" (e.g., 0.5kg or 500g)'
        );
        setSubmitting(false);
        return;
      }
      form.append("weight", weightValue);
      form.append("weightUnit", weightValue < 1 ? "g" : "kg");
    } else {
      form.append("weight", "");
      form.append("weightUnit", "kg");
    }

    form.append("model", formData.model || "");
    if (formData.mainImage) form.append("image", formData.mainImage);
    formData.newImages.forEach((image) => {
      if (image.file instanceof File) form.append("images", image.file);
    });
    if (formData.existingImages.length > 0) {
      form.append("existingImages", JSON.stringify(formData.existingImages));
    }
    form.append("variants", JSON.stringify(formData.variants || []));

    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        throw new Error("Session expired. Please log in again.");
      }

      let updatedProduct;
      if (editingProductId) {
        const res = await axios.put(
          `https://backend-ps76.onrender.com/api/admin/products/${editingProductId}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        updatedProduct = res.data.product;
        setProducts((prev) =>
          prev.map((p) =>
            p._id === editingProductId
              ? { ...updatedProduct, selected: p.selected || false }
              : p
          )
        );
        toast.success("Product updated successfully!");
      } else {
        const res = await axios.post(
          "https://backend-ps76.onrender.com/api/admin/products",
          form,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        updatedProduct = res.data.product;
        setProducts((prev) =>
          [updatedProduct, ...prev].map((p) => ({ ...p, selected: false }))
        );
        setCurrentPage(1);
        toast.success("Product added successfully!");
      }
      resetForm();
    } catch (err) {
      console.error(
        "Error saving product:",
        err.response ? err.response.data : err.message
      );
      if (err.response?.status === 401) {
        toast.error("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error(
          err.response?.data?.message ||
            err.message ||
            "Failed to save product."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }; */


  /* const handleVariantSubmit = async (e) => {
    e.preventDefault();
    if (!validateVariantForm()) return;

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        throw new Error("Session expired. Please log in again.");
      }

      const productToUpdate = products.find((p) => p._id === variantModal);
      if (!productToUpdate) {
        throw new Error("Product not found.");
      }

      let validatedSubcategory = productToUpdate.subcategory || "";
      if (
        productToUpdate.category &&
        categories[productToUpdate.category] &&
        Object.keys(categories[productToUpdate.category]).length > 0
      ) {
        const validSubcategories = Object.keys(
          categories[productToUpdate.category]
        );
        if (
          !validatedSubcategory ||
          !validSubcategories.includes(validatedSubcategory)
        ) {
          validatedSubcategory = validSubcategories[0];
          if (!validatedSubcategory) {
            throw new Error(
              `No valid subcategories available for category ${productToUpdate.category}.`
            );
          }
          console.warn(
            `Subcategory for product ${productToUpdate._id} (category: ${productToUpdate.category}) was invalid. Defaulted to: ${validatedSubcategory}`
          );
        }
      }

      let validatedNestedCategory = productToUpdate.nestedCategory || "";
      if (
        validatedSubcategory &&
        categories[productToUpdate.category] &&
        categories[productToUpdate.category][validatedSubcategory] &&
        categories[productToUpdate.category][validatedSubcategory].length > 0
      ) {
        const validNestedCategories =
          categories[productToUpdate.category][validatedSubcategory];
        if (
          !validatedNestedCategory ||
          !validNestedCategories.includes(validatedNestedCategory)
        ) {
          validatedNestedCategory = validNestedCategories[0];
          if (!validatedNestedCategory) {
            throw new Error(
              `No valid nested categories available for subcategory ${validatedSubcategory}.`
            );
          }
          console.warn(
            `Nested category for product ${productToUpdate._id} (subcategory: ${validatedSubcategory}) was invalid. Defaulted to: ${validatedNestedCategory}`
          );
        }
      }

      const variantId = Date.now().toString();

      const newVariant = {
        variantId,
        mainImage: null,
        additionalImages: [],
        specifications: variantFormData.specifications || {},
      };

      const variantForm = new FormData();
      if (variantFormData.mainImage) {
        variantForm.append("variantMainImage", variantFormData.mainImage);
      }
      if (variantFormData.newImages && variantFormData.newImages.length > 0) {
        variantFormData.newImages.forEach((image) => {
          if (image.file instanceof File) {
            variantForm.append(`variantImages`, image.file);
          }
        });
      }

      const updateForm = new FormData();
      updateForm.append("name", productToUpdate.name);
      updateForm.append("price", productToUpdate.price);
      updateForm.append(
        "discountedPrice",
        productToUpdate.discountedPrice || ""
      );
      updateForm.append("sku", productToUpdate.sku || "");
      updateForm.append("category", productToUpdate.category);
      updateForm.append("subcategory", validatedSubcategory);
      updateForm.append("nestedCategory", validatedNestedCategory);
      updateForm.append("stock", productToUpdate.stock);
      updateForm.append("description", productToUpdate.description || "");
      updateForm.append("offer", productToUpdate.offer || "");
      updateForm.append("sizes", JSON.stringify(productToUpdate.sizes));
      updateForm.append("packOf", productToUpdate.packOf || "");
      updateForm.append("seller", productToUpdate.seller || "");
      updateForm.append(
        "specifications",
        JSON.stringify(productToUpdate.specifications || {})
      );
      updateForm.append("warranty", productToUpdate.warranty || "");
      updateForm.append("isActive", productToUpdate.isActive);
      updateForm.append("featured", productToUpdate.featured);
      updateForm.append("dealTag", productToUpdate.dealTag || "");
      updateForm.append("brand", productToUpdate.brand || "");
      updateForm.append("weight", productToUpdate.weight || "");
      updateForm.append("weightUnit", productToUpdate.weightUnit || "kg");
      updateForm.append("model", productToUpdate.model || "");
      updateForm.append(
        "existingImages",
        JSON.stringify(productToUpdate.images || [])
      );
      updateForm.append(
        "variants",
        JSON.stringify([...(productToUpdate.variants || []), newVariant])
      );

      variantForm.forEach((value, key) => {
        updateForm.append(key, value);
      });

      const res = await axios.put(
        `https://backend-ps76.onrender.com/api/admin/products/${variantModal}`,
        updateForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedProduct = res.data.product;
      setProducts((prev) =>
        prev.map((p) =>
          p._id === variantModal
            ? { ...updatedProduct, selected: p.selected || false }
            : p
        )
      );

      toast.success("Variant added successfully!");
      setVariantModal(null);
      setVariantFormData(null);
    } catch (err) {
      console.error(
        "Error saving variant:",
        err.response ? err.response.data : err.message
      );
      if (err.response?.status === 401) {
        toast.error("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error(
          err.response?.data?.message || err.message || "Failed to add variant."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }; */


// ... (previous imports and initial state remain unchanged)

// Inside the ProductManagement component...

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setSubmitting(true);

  const form = new FormData();
  form.append("name", formData.name);
  form.append("price", formData.price);
  form.append("discountedPrice", formData.discountedPrice || "");
  form.append("sku", formData.sku || "");
  form.append("category", formData.category);
  form.append("subcategory", formData.subcategory || ""); // Ensure sent even if empty
  form.append("nestedCategory", formData.nestedCategory || ""); // Ensure sent even if empty
  form.append("stock", formData.stock);
  form.append("description", formData.description || "");
  form.append("offer", formData.offer || "");
  form.append("sizes", JSON.stringify(formData.sizes));
  form.append("packOf", formData.packOf || "");
  form.append("seller", formData.seller || "");

  const specs = { ...formData.specifications };
  if (formData.nestedCategory === "Trimmers") {
    if (formData.trimmingRange) {
      if (!specs["Trimming Range"]) specs["Trimming Range"] = {};
      specs["Trimming Range"]["Range"] = formData.trimmingRange;
    }
    if (formData.bladeMaterial) {
      if (!specs["Blade Material"]) specs["Blade Material"] = {};
      specs["Blade Material"]["Material"] = formData.bladeMaterial;
    }
  }
  form.append("specifications", JSON.stringify(specs));

  form.append("warranty", formData.warranty || "");
  form.append("isActive", formData.isActive);
  form.append("featured", formData.featured);
  form.append("dealTag", formData.dealTag || "");
  form.append("brand", formData.brand || "");

  let weightValue = formData.weight.trim();
  if (weightValue) {
    if (weightValue.toLowerCase().endsWith("g")) {
      weightValue = parseFloat(weightValue.replace(/g/i, "")) / 1000;
    } else if (weightValue.toLowerCase().endsWith("kg")) {
      weightValue = parseFloat(weightValue.replace(/kg/i, ""));
    } else {
      weightValue = parseFloat(weightValue);
    }
    if (isNaN(weightValue) || weightValue <= 0) {
      toast.error(
        'Invalid weight format. Use numbers with "kg" or "g" (e.g., 0.5kg or 500g)'
      );
      setSubmitting(false);
      return;
    }
    form.append("weight", weightValue);
    form.append("weightUnit", weightValue < 1 ? "g" : "kg");
  } else {
    form.append("weight", "");
    form.append("weightUnit", "kg");
  }

  form.append("model", formData.model || "");
  if (formData.mainImage) form.append("image", formData.mainImage);
  formData.newImages.forEach((image) => {
    if (image.file instanceof File) form.append("images", image.file);
  });
  if (formData.existingImages.length > 0) {
    form.append("existingImages", JSON.stringify(formData.existingImages));
  }
  form.append("variants", JSON.stringify(formData.variants || []));

  try {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      throw new Error("Session expired. Please log in again.");
    }

    let updatedProduct;
    if (editingProductId) {
      const res = await axios.put(
        `https://backend-ps76.onrender.com/api/admin/products/${editingProductId}`,
        form,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updatedProduct = res.data.product;
      setProducts((prev) =>
        prev.map((p) =>
          p._id === editingProductId
            ? { ...updatedProduct, selected: p.selected || false }
            : p
        )
      );
      toast.success("Product updated successfully!");
    } else {
      const res = await axios.post(
        "https://backend-ps76.onrender.com/api/admin/products",
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      updatedProduct = res.data.product;
      setProducts((prev) =>
        [updatedProduct, ...prev].map((p) => ({ ...p, selected: false }))
      );
      setCurrentPage(1);
      toast.success("Product added successfully!");
    }
    resetForm();
  } catch (err) {
    console.error(
      "Error saving product:",
      err.response ? err.response.data : err.message
    );
    if (err.response?.status === 401) {
      toast.error("Session expired or unauthorized. Please log in again.");
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "Failed to save product."
      );
    }
  } finally {
    setSubmitting(false);
  }
};

const handleVariantSubmit = async (e) => {
  e.preventDefault();
  if (!validateVariantForm()) return;

  setSubmitting(true);

  try {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      throw new Error("Session expired. Please log in again.");
    }

    const productToUpdate = products.find((p) => p._id === variantModal);
    if (!productToUpdate) {
      throw new Error("Product not found.");
    }

    const variantId = Date.now().toString();

    const newVariant = {
      variantId,
      mainImage: null,
      additionalImages: [],
      specifications: variantFormData.specifications || {},
    };

    const variantForm = new FormData();
    if (variantFormData.mainImage) {
      variantForm.append("variantMainImage", variantFormData.mainImage);
    }
    if (variantFormData.newImages && variantFormData.newImages.length > 0) {
      variantFormData.newImages.forEach((image) => {
        if (image.file instanceof File) {
          variantForm.append(`variantImages`, image.file);
        }
      });
    }

    const updateForm = new FormData();
    updateForm.append("name", productToUpdate.name);
    updateForm.append("price", productToUpdate.price);
    updateForm.append("discountedPrice", productToUpdate.discountedPrice || "");
    updateForm.append("sku", productToUpdate.sku || "");
    updateForm.append("category", productToUpdate.category);
    updateForm.append("subcategory", productToUpdate.subcategory || ""); // Ensure sent
    updateForm.append("nestedCategory", productToUpdate.nestedCategory || ""); // Ensure sent
    updateForm.append("stock", productToUpdate.stock);
    updateForm.append("description", productToUpdate.description || "");
    updateForm.append("offer", productToUpdate.offer || "");
    updateForm.append("sizes", JSON.stringify(productToUpdate.sizes));
    updateForm.append("packOf", productToUpdate.packOf || "");
    updateForm.append("seller", productToUpdate.seller || "");
    updateForm.append(
      "specifications",
      JSON.stringify(productToUpdate.specifications || {})
    );
    updateForm.append("warranty", productToUpdate.warranty || "");
    updateForm.append("isActive", productToUpdate.isActive);
    updateForm.append("featured", productToUpdate.featured);
    updateForm.append("dealTag", productToUpdate.dealTag || "");
    updateForm.append("brand", productToUpdate.brand || "");
    updateForm.append("weight", productToUpdate.weight || "");
    updateForm.append("weightUnit", productToUpdate.weightUnit || "kg");
    updateForm.append("model", productToUpdate.model || "");
    updateForm.append(
      "existingImages",
      JSON.stringify(productToUpdate.images || [])
    );
    updateForm.append(
      "variants",
      JSON.stringify([...(productToUpdate.variants || []), newVariant])
    );

    variantForm.forEach((value, key) => {
      updateForm.append(key, value);
    });

    const res = await axios.put(
      `https://backend-ps76.onrender.com/api/admin/products/${variantModal}`,
      updateForm,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const updatedProduct = res.data.product;
    setProducts((prev) =>
      prev.map((p) =>
        p._id === variantModal
          ? { ...updatedProduct, selected: p.selected || false }
          : p
      )
    );

    toast.success("Variant added successfully!");
    setVariantModal(null);
    setVariantFormData(null);
  } catch (err) {
    console.error(
      "Error saving variant:",
      err.response ? err.response.data : err.message
    );
    if (err.response?.status === 401) {
      toast.error("Session expired or unauthorized. Please log in again.");
      localStorage.removeItem("token");
      navigate("/login");
    } else {
      toast.error(
        err.response?.data?.message || err.message || "Failed to add variant."
      );
    }
  } finally {
    setSubmitting(false);
  }
};











  const handleEdit = (product) => {
    const currentVariantId = selectedVariant[product._id] || "default";
    const variant =
      currentVariantId === "default"
        ? null
        : product.variants.find((v) => v.variantId === currentVariantId);

    const mainImage = variant
      ? variant.mainImage || product.image
      : product.image;
    const additionalImages = variant
      ? (variant.additionalImages || []).filter(
          (img) => img !== (variant.mainImage || product.image)
        )
      : Array.isArray(product.images)
      ? product.images.filter((img) => img !== product.image)
      : [];
    const specifications = variant
      ? variant.specifications || product.specifications
      : product.specifications || {};

    setFormData({
      name: product.name,
      price: product.price,
      discountedPrice: product.discountedPrice || "",
      sku: product.sku || "",
      category: product.category,
      subcategory: product.subcategory,
      nestedCategory: product.nestedCategory,
      stock: product.stock,
      description: product.description,
      mainImage: null,
      currentMainImage: mainImage,
      existingImages: additionalImages,
      newImages: [],
      offer: product.offer || "",
      sizes: product.sizes || [],
      packOf: product.packOf || "",
      trimmingRange: specifications?.["Trimming Range"]?.["Range"] || "",
      bladeMaterial: specifications?.["Blade Material"]?.["Material"] || "",
      seller: product.seller || "",
      specifications: specifications,
      warranty: product.warranty || "",
      isActive: product.isActive,
      featured: product.featured,
      dealTag: product.dealTag || "",
      brand: product.brand || "",
      weight: product.weight
        ? product.weightUnit === "g"
          ? `${product.weight * 1000}g`
          : `${product.weight}kg`
        : "",
      model: product.model || "",
      variants: product.variants || [],
    });
    setEditingProductId(product._id);
    setSelectedImage({});
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        throw new Error("Session expired. Please log in again.");
      }

      await axios.delete(
        `https://backend-ps76.onrender.com/api/admin/products/${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success("Product deleted successfully!");
      setShouldFetch(true);
    } catch (err) {
      console.error(
        "Error deleting product:",
        err.response ? err.response.data : err.message
      );
      if (err.response?.status === 401) {
        toast.error("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error(err.response?.data?.message || "Failed to delete product.");
      }
    }
  };

  const handleBulkDelete = async () => {
    const selectedProducts = products.filter((p) => p.selected);
    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product to delete");
      return;
    }
    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedProducts.length} products?`
      )
    )
      return;
    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        throw new Error("Session expired. Please log in again.");
      }

      await Promise.all(
        selectedProducts.map((p) =>
          axios.delete(
            `https://backend-ps76.onrender.com/api/admin/products/${p._id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        )
      );
      setProducts((prev) => prev.filter((p) => !p.selected));
      toast.success(
        `${selectedProducts.length} products deleted successfully!`
      );
      setShouldFetch(true);
    } catch (err) {
      console.error(
        "Error bulk deleting products:",
        err.response ? err.response.data : err.message
      );
      if (err.response?.status === 401) {
        toast.error("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error(
          err.response?.data?.message || "Failed to bulk delete products."
        );
      }
    }
  };

  const handleDuplicate = async (product) => {
    const form = new FormData();
    form.append("name", `${product.name} (Copy)`);
    form.append("price", product.price);
    form.append("discountedPrice", product.discountedPrice || "");
    form.append("sku", product.sku || "");
    form.append("category", product.category);
    form.append("subcategory", product.subcategory);
    form.append("nestedCategory", product.nestedCategory);
    form.append("stock", product.stock);
    form.append("description", product.description);
    form.append("offer", product.offer || "");
    form.append("sizes", JSON.stringify(product.sizes || []));
    form.append("packOf", product.packOf || "");
    form.append("seller", product.seller || "");
    form.append("specifications", JSON.stringify(product.specifications || {}));
    form.append("warranty", product.warranty || "");
    form.append("isActive", product.isActive);
    form.append("featured", product.featured);
    form.append("dealTag", product.dealTag || "");
    form.append("brand", product.brand || "");
    form.append("weight", product.weight || "");
    form.append("weightUnit", product.weightUnit || "kg");
    form.append("model", product.model || "");
    form.append(
      "existingImages",
      JSON.stringify([product.image, ...product.images])
    );
    form.append("variants", JSON.stringify(product.variants || []));

    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        throw new Error("Session expired. Please log in again.");
      }

      await axios.post(
        "https://backend-ps76.onrender.com/api/admin/products",
        form,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCurrentPage(1);
      setShouldFetch(true);
      toast.success("Product duplicated successfully!");
    } catch (err) {
      console.error(
        "Error duplicating product:",
        err.response ? err.response.data : err.message
      );
      if (err.response?.status === 401) {
        toast.error("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error(
          err.response?.data?.message || "Failed to duplicate product."
        );
      }
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem("token");
      if (!token || isTokenExpired(token)) {
        throw new Error("Session expired. Please log in again.");
      }

      const res = await axios.put(
        `https://backend-ps76.onrender.com/api/admin/products/${productId}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedProduct = res.data.product;
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId
            ? { ...updatedProduct, selected: p.selected || false }
            : p
        )
      );
      toast.success(
        `Product ${!currentStatus ? "activated" : "deactivated"} successfully!`
      );
      setShouldFetch(true);
    } catch (err) {
      console.error(
        "Error toggling product status:",
        err.response ? err.response.data : err.message
      );
      if (err.response?.status === 401) {
        toast.error("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        toast.error(
          err.response?.data?.message || "Failed to toggle product status."
        );
      }
    }
  };

  const toggleSelectProduct = (productId) => {
    setProducts((prev) =>
      prev.map((p) =>
        p._id === productId ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const openPreviewModal = (product) => {
    setPreviewModal(product);
    setSelectedImage((prev) => ({
      ...prev,
      [product._id]: product.image,
    }));
    setSelectedVariant((prev) => ({
      ...prev,
      [product._id]: "default",
    }));
  };

  const closePreviewModal = () => {
    setPreviewModal(null);
    setSelectedImage((prev) => {
      const newState = { ...prev };
      delete newState[previewModal._id];
      return newState;
    });
    setSelectedVariant((prev) => {
      const newState = { ...prev };
      delete newState[previewModal._id];
      return newState;
    });
  };

  const openVariantModal = (product) => {
    let subcategory = product.subcategory || "";
    let nestedCategory = product.nestedCategory || "";

    if (
      product.category &&
      categories[product.category] &&
      Object.keys(categories[product.category]).length > 0
    ) {
      const validSubcategories = Object.keys(categories[product.category]);
      if (!subcategory || !validSubcategories.includes(subcategory)) {
        subcategory = validSubcategories[0] || "";
      }
    }

    if (
      subcategory &&
      categories[product.category] &&
      categories[product.category][subcategory] &&
      categories[product.category][subcategory].length > 0
    ) {
      const validNestedCategories = categories[product.category][subcategory];
      if (!nestedCategory || !validNestedCategories.includes(nestedCategory)) {
        nestedCategory = validNestedCategories[0] || "";
      }
    }

    setVariantFormData({
      mainImage: null,
      currentMainImage: null,
      newImages: [],
      specifications: { ...product.specifications },
      category: product.category,
      subcategory,
      nestedCategory,
    });
    setVariantModal(product._id);
  };

  const closeVariantModal = () => {
    if (
      variantFormData.currentMainImage &&
      typeof variantFormData.currentMainImage !== "string"
    ) {
      URL.revokeObjectURL(variantFormData.currentMainImage);
    }
    variantFormData.newImages.forEach((image) => {
      if (image.preview) URL.revokeObjectURL(image.preview);
    });
    setVariantModal(null);
    setVariantFormData(null);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    setShouldFetch(true);
  };

  const handleImageSelect = (productId, imageUrl) => {
    setSelectedImage((prev) => ({
      ...prev,
      [productId]: imageUrl,
    }));
  };

  const handleVariantSelect = (productId, variantId) => {
    setSelectedVariant((prev) => ({
      ...prev,
      [productId]: variantId,
    }));

    const product = products.find((p) => p._id === productId) || previewModal;
    const variant =
      variantId === "default"
        ? null
        : product.variants.find((v) => v.variantId === variantId);
    const mainImage = variant?.mainImage || product.image;
    setSelectedImage((prev) => ({
      ...prev,
      [productId]: mainImage,
    }));
  };

  const csvData = products.map((p) => ({
    id: p._id,
    name: p.name,
    price: p.price,
    discountedPrice: p.discountedPrice || "",
    sku: p.sku || "",
    category: p.category,
    subcategory: p.subcategory,
    nestedCategory: p.nestedCategory,
    stock: p.stock,
    description: p.description,
    offer: p.offer || "",
    sizes: p.sizes?.join(", ") || "",
    packOf: p.packOf || "",
    seller: p.seller || "",
    warranty: p.warranty || "",
    isActive: p.isActive ? "Yes" : "No",
    featured: p.featured ? "Yes" : "No",
    dealTag: p.dealTag || "",
    image: p.image,
    images: p.images?.join(", ") || "",
    brand: p.brand || "",
    weight: p.weight || "",
    weightUnit: p.weightUnit || "kg",
    model: p.model || "",
    specifications: JSON.stringify(p.specifications || {}),
    variants: JSON.stringify(p.variants || []),
  }));

  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return (
    <div className="product-management-container">
      <div className="header">
        <h2>Product Management</h2>
        <div className="header-actions">
          <button
            className="dashboard-btn"
            onClick={() => navigate("/dashboard")}
          >
            Go to Dashboard
          </button>
        </div>
      </div>

      <div className="add-product-section">
        <button
          className="add-product-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Hide Form" : "Add New Product"}
        </button>
        <label className="bulk-upload-label">
          Bulk Upload (CSV)
          <input
            type="file"
            name="bulkUpload"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {showForm && (
        <section className="product-form-section">
          <h2>{editingProductId ? "Edit Product" : "Add New Product"}</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>SKU</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Price (₹)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Discounted Price (₹)</label>
              <input
                type="number"
                name="discountedPrice"
                value={formData.discountedPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label>Main Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={(e) => {
                  handleInputChange(e);
                  setFormData((prev) => ({
                    ...prev,
                    subcategory: "",
                    nestedCategory: "",
                  }));
                }}
                required
              >
                <option value="">Select Main Category</option>
                {Object.keys(categories).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {formData.category &&
              categories[formData.category] &&
              Object.keys(categories[formData.category]).length > 0 && (
                <div className="form-group">
                  <label>Subcategory</label>
                  <select
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => {
                      handleInputChange(e);
                      setFormData((prev) => ({ ...prev, nestedCategory: "" }));
                    }}
                    required
                  >
                    <option value="">Select Subcategory</option>
                    {Object.keys(categories[formData.category]).map(
                      (subcat) => (
                        <option key={subcat} value={subcat}>
                          {subcat}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}
            {formData.category &&
              formData.subcategory &&
              categories[formData.category][formData.subcategory] && (
                <div className="form-group">
                  <label>Nested Category</label>
                  <select
                    name="nestedCategory"
                    value={formData.nestedCategory}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Nested Category</option>
                    {categories[formData.category][formData.subcategory].map(
                      (nestedCat) => (
                        <option key={nestedCat} value={nestedCat}>
                          {nestedCat}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}
            {sizeOptions.length > 0 && (
              <div className="form-group">
                <label>Sizes</label>
                <div className="size-options">
                  {sizeOptions.map((size) => (
                    <label key={size} className="size-label">
                      <input
                        type="checkbox"
                        checked={formData.sizes.includes(size)}
                        onChange={() => handleSizeChange(size)}
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {(formData.nestedCategory === "Luggage" ||
              formData.nestedCategory === "Luggage & Bags") && (
              <div className="form-group">
                <label>Pack Of</label>
                <select
                  name="packOf"
                  value={formData.packOf}
                  onChange={handleInputChange}
                >
                  <option value="">Select Pack Of</option>
                  {packOfOptions.map((pack) => (
                    <option key={pack} value={pack}>
                      {pack}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {formData.nestedCategory === "Trimmers" && (
              <>
                <div className="form-group">
                  <label>Trimming Range (e.g., 0.5-7mm)</label>
                  <input
                    type="text"
                    name="trimmingRange"
                    value={formData.trimmingRange}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Blade Material</label>
                  <select
                    name="bladeMaterial"
                    value={formData.bladeMaterial}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Blade Material</option>
                    {bladeMaterialOptions.map((material) => (
                      <option key={material} value={material}>
                        {material}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className="form-group">
              <label>Seller</label>
              <input
                type="text"
                name="seller"
                value={formData.seller}
                onChange={handleInputChange}
                placeholder="Enter seller name"
              />
            </div>
            <div className="form-group">
              <label>Specifications</label>
              {Object.keys(formData.specifications || {}).length > 0 ? (
                Object.entries(formData.specifications).map(
                  ([section, specs]) => (
                    <div key={section} className="specification-section">
                      <h4>{section}</h4>
                      <div className="spec-field">
                        <input
                          type="text"
                          value={section}
                          onChange={(e) =>
                            handleSpecificationSectionNameChange(
                              section,
                              e.target.value
                            )
                          }
                          placeholder="Section Name"
                        />
                      </div>
                      {Object.entries(specs || {}).map(([key, value]) => (
                        <div key={key} className="spec-field">
                          <input
                            type="text"
                            value={key}
                            onChange={(e) =>
                              handleSpecificationChange(
                                section,
                                key,
                                e.target.value,
                                true
                              )
                            }
                            placeholder="Key (e.g., Color)"
                          />
                          <input
                            type="text"
                            value={value || ""}
                            onChange={(e) =>
                              handleSpecificationChange(
                                section,
                                key,
                                e.target.value
                              )
                            }
                            placeholder="Value (e.g., Red)"
                            required
                          />
                          <button
                            type="button"
                            onClick={() =>
                              removeSpecificationField(section, key)
                            }
                            className="remove-btn"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addSpecificationField(section)}
                        className="add-btn"
                      >
                        Add Specification
                      </button>
                    </div>
                  )
                )
              ) : (
                <p>No specifications added.</p>
              )}
              <button
                type="button"
                onClick={addSpecificationSection}
                className="add-btn"
              >
                Add Specification Section
              </button>
            </div>
            <div className="form-group">
              <label>Warranty</label>
              <input
                type="text"
                name="warranty"
                value={formData.warranty}
                onChange={handleInputChange}
                placeholder="e.g., 1 Year"
              />
            </div>
            <div className="form-group">
              <label>Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                required
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Offer (e.g., "35% off")</label>
              <input
                type="text"
                name="offer"
                value={formData.offer}
                onChange={handleInputChange}
                placeholder="e.g., 35% off"
              />
            </div>
            <div className="form-group">
              <label>Deal Tag</label>
              <select
                name="dealTag"
                value={formData.dealTag}
                onChange={handleInputChange}
              >
                <option value="">None</option>
                {dealTagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                placeholder="Enter brand name"
              />
            </div>
            <div className="form-group">
              <label>Weight (kg or g)</label>
              <input
                type="text"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                placeholder="e.g., 0.5kg or 500g"
              />
            </div>
            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="Enter model name"
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <label className="status-toggle">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                Active
              </label>
            </div>
            <div className="form-group">
              <label>Featured</label>
              <label className="status-toggle">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                />
                Featured
              </label>
            </div>
            <div className="form-group">
              <label>Main Image</label>
              <input
                type="file"
                id="mainImageInput"
                name="mainImage"
                accept="image/*"
                onChange={handleFileChange}
                required={
                  !editingProductId && formData.existingImages.length === 0
                }
              />
              {formData.currentMainImage && (
                <div className="image-preview">
                  <img
                    src={formData.currentMainImage}
                    alt="Main Preview"
                    onError={(e) => {
                      e.target.src = "/default-product.jpg";
                      e.target.onerror = null;
                    }}
                  />
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Additional Images</label>
              <input
                type="file"
                id="additionalImagesInput"
                name="images"
                accept="image/*"
                multiple
                onChange={handleFileChange}
              />
              <div className="additional-images-preview">
                {formData.existingImages.map((image, index) => (
                  <div key={`existing-${index}`} className="image-preview-item">
                    <img
                      src={image}
                      alt={`Existing ${index}`}
                      onError={(e) => {
                        e.target.src = "/default-product.jpg";
                        e.target.onerror = null;
                      }}
                    />
                    <button
                      type="button"
                      className="delete-image-btn"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          existingImages: prev.existingImages.filter(
                            (_, i) => i !== index
                          ),
                        }))
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {formData.newImages.map((image, index) => (
                  <div key={`new-${index}`} className="image-preview-item">
                    <img
                      src={image.preview}
                      alt={`New ${index}`}
                      onError={(e) => {
                        e.target.src = "/default-product.jpg";
                        e.target.onerror = null;
                      }}
                    />
                    <button
                      type="button"
                      className="delete-image-btn"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          newImages: prev.newImages.filter(
                            (_, i) => i !== index
                          ),
                        }))
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="save-btn" disabled={submitting}>
                {submitting
                  ? "Saving..."
                  : editingProductId
                  ? "Update Product"
                  : "Add Product"}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="product-list-section">
        <h2>Product List</h2>
        <div className="product-controls">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setFilterSubcategory("");
              setFilterNestedCategory("");
            }}
            className="filter-select"
          >
            <option value="">All Main Categories</option>
            {Object.keys(categories).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {filterCategory &&
            categories[filterCategory] &&
            Object.keys(categories[filterCategory] || {}).length > 0 && (
              <select
                value={filterSubcategory}
                onChange={(e) => {
                  setFilterSubcategory(e.target.value);
                  setFilterNestedCategory("");
                }}
                className="filter-select"
              >
                <option value="">All Subcategories</option>
                {Object.keys(categories[filterCategory] || {}).map((subcat) => (
                  <option key={subcat} value={subcat}>
                    {subcat}
                  </option>
                ))}
              </select>
            )}
          {filterCategory &&
            filterSubcategory &&
            categories[filterCategory] &&
            categories[filterCategory][filterSubcategory] && (
              <select
                value={filterNestedCategory}
                onChange={(e) => setFilterNestedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="">All Nested Categories</option>
                {(categories[filterCategory][filterSubcategory] || []).map(
                  (nestedCat) => (
                    <option key={nestedCat} value={nestedCat}>
                      {nestedCat}
                    </option>
                  )
                )}
              </select>
            )}
          <input
            type="number"
            placeholder="Min Price"
            value={filterPriceMin}
            onChange={(e) => setFilterPriceMin(e.target.value)}
            className="filter-input"
            min="0"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filterPriceMax}
            onChange={(e) => setFilterPriceMax(e.target.value)}
            className="filter-input"
            min="0"
          />
          <select
            value={filterStock}
            onChange={(e) => setFilterStock(e.target.value)}
            className="filter-select"
          >
            <option value="">All Stock</option>
            <option value="inStock">In Stock</option>
            <option value="lowStock">Low Stock (1-5)</option>
            <option value="outOfStock">Out of Stock</option>
          </select>
          <select
            value={filterOffer}
            onChange={(e) => setFilterOffer(e.target.value)}
            className="filter-select"
          >
            <option value="">All Offers</option>
            <option value="hasOffer">Has Offer</option>
            <option value="noOffer">No Offer</option>
          </select>
          <button
            onClick={handleBulkDelete}
            className="bulk-delete-btn"
            disabled={!products.some((p) => p.selected)}
          >
            Bulk Delete
          </button>
          <button onClick={resetFilters} className="reset-filters-btn">
            Reset Filters
          </button>
          <CSVLink
            data={csvData}
            filename="products.csv"
            className="export-btn"
          >
            Export to CSV
          </CSVLink>
        </div>
        <div className="product-grid">
          {products.length > 0 ? (
            products.map((product) => {
              const currentVariantId =
                selectedVariant[product._id] || "default";
              const variant =
                currentVariantId === "default"
                  ? null
                  : product.variants.find(
                      (v) => v.variantId === currentVariantId
                    );
              const currentImage =
                selectedImage[product._id] ||
                variant?.mainImage ||
                product.image ||
                "/default-product.jpg";
              const allImages = variant
                ? [
                    variant.mainImage || product.image,
                    ...(variant.additionalImages || product.images || []),
                  ].filter(Boolean)
                : [product.image, ...(product.images || [])].filter(Boolean);

              return (
                <div key={product._id} className="product-card">
                  <input
                    type="checkbox"
                    checked={product.selected || false}
                    onChange={() => toggleSelectProduct(product._id)}
                    className="select-checkbox"
                  />
                  <div className="image-wrapper">
                    <img
                      src={currentImage || "/default-product.jpg"}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.src = "/default-product.jpg";
                        e.target.onerror = null;
                      }}
                    />
                    {product.dealTag && (
                      <span className="deal-tag">{product.dealTag}</span>
                    )}
                  </div>
                  {allImages.length > 1 && (
                    <div className="image-thumbnails">
                      {allImages.map((img, index) => (
                        <img
                          key={index}
                          src={img || "/default-product.jpg"}
                          alt={`Thumbnail ${index}`}
                          className={`thumbnail ${
                            currentImage === img ? "selected" : ""
                          }`}
                          onClick={() => handleImageSelect(product._id, img)}
                          onError={(e) => {
                            e.target.src = "/default-product.jpg";
                            e.target.onerror = null;
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {product.variants && product.variants.length > 0 && (
                    <div className="variant-selector">
                      <label>Variant: </label>
                      <select
                        value={currentVariantId}
                        onChange={(e) =>
                          handleVariantSelect(product._id, e.target.value)
                        }
                      >
                        <option value="default">Default</option>
                        {product.variants.map((variant, index) => (
                          <option
                            key={variant.variantId}
                            value={variant.variantId}
                          >
                            Variant {index + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="product-details">
                    <h3>{product.name}</h3>
                    <p>SKU: {product.sku || "N/A"}</p>
                    <p>
                      Price: ₹{product.price.toFixed(2)}
                      {product.discountedPrice ? (
                        <span className="discounted-price">
                          {" "}
                          (Now ₹{product.discountedPrice.toFixed(2)})
                        </span>
                      ) : null}
                    </p>
                    <p>
                      Category: {product.category || "N/A"}
                      {product.subcategory ? ` > ${product.subcategory}` : ""}
                      {product.nestedCategory
                        ? ` > ${product.nestedCategory}`
                        : ""}
                    </p>
                    <p>
                      Stock: {product.stock}{" "}
                      {product.stock === 0 ? (
                        <span className="stock-badge out-of-stock">
                          Out of Stock
                        </span>
                      ) : product.stock <= 5 ? (
                        <span className="stock-badge low-stock">Low Stock</span>
                      ) : (
                        <span className="stock-badge in-stock">In Stock</span>
                      )}
                    </p>
                    {product.offer && (
                      <p className="offer">Offer: {product.offer}</p>
                    )}
                    {product.sizes?.length > 0 && (
                      <p>Sizes: {product.sizes.join(", ")}</p>
                    )}
                    {product.packOf && <p>Pack Of: {product.packOf}</p>}
                    {product.seller && <p>Seller: {product.seller}</p>}
                    {product.warranty && <p>Warranty: {product.warranty}</p>}
                    {product.brand && <p>Brand: {product.brand}</p>}
                    {product.weight && (
                      <p>
                        Weight:{" "}
                        {product.weightUnit === "g"
                          ? `${product.weight * 1000} g`
                          : `${product.weight} kg`}
                      </p>
                    )}
                    {product.model && <p>Model: {product.model}</p>}
                    {Object.keys(product.specifications || {}).length > 0 ? (
                      <div className="specifications-preview">
                        {Object.entries(product.specifications || {}).map(
                          ([section, specs]) => (
                            <div key={section}>
                              <h4>{section}</h4>
                              {Object.entries(specs || {}).map(
                                ([key, value]) => (
                                  <p key={key} className="spec-item">
                                    <span className="spec-key">{key}:</span>{" "}
                                    <span className="spec-value">
                                      {value || "N/A"}
                                    </span>
                                  </p>
                                )
                              )}
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p>No specifications available.</p>
                    )}
                  </div>
                  <div className="product-actions">
                    <button
                      onClick={() => openPreviewModal(product)}
                      className="preview-btn"
                    >
                      Preview
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDuplicate(product)}
                      className="duplicate-btn"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={() =>
                        toggleProductStatus(product._id, product.isActive)
                      }
                      className={
                        product.isActive ? "deactivate-btn" : "activate-btn"
                      }
                    >
                      {product.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => openVariantModal(product)}
                      className="add-variant-btn1"
                    >
                      Add Variant
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p>No products found.</p>
          )}
        </div>
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                handlePageChange(Math.min(currentPage + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </section>

      {previewModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={closePreviewModal}>
              ✕
            </button>
            <h2>{previewModal.name}</h2>
            <div className="modal-body">
              <div className="modal-image-section">
                <img
                  src={
                    selectedImage[previewModal._id] ||
                    previewModal.image ||
                    "/default-product.jpg"
                  }
                  alt={previewModal.name}
                  className="modal-main-image"
                  onError={(e) => {
                    e.target.src = "/default-product.jpg";
                    e.target.onerror = null;
                  }}
                />
                <div className="image-thumbnails">
                  {[previewModal.image, ...(previewModal.images || [])].map(
                    (img, index) => (
                      <img
                        key={index}
                        src={img || "/default-product.jpg"}
                        alt={`Thumbnail ${index}`}
                        className={`thumbnail ${
                          selectedImage[previewModal._id] === img
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => handleImageSelect(previewModal._id, img)}
                        onError={(e) => {
                          e.target.src = "/default-product.jpg";
                          e.target.onerror = null;
                        }}
                      />
                    )
                  )}
                </div>
                {previewModal.variants && previewModal.variants.length > 0 && (
                  <div className="variant-selector">
                    <label>Variant: </label>
                    <select
                      value={selectedVariant[previewModal._id] || "default"}
                      onChange={(e) =>
                        handleVariantSelect(previewModal._id, e.target.value)
                      }
                    >
                      <option value="default">Default</option>
                      {previewModal.variants.map((variant, index) => (
                        <option
                          key={variant.variantId}
                          value={variant.variantId}
                        >
                          Variant {index + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-details">
                <p>
                  <strong>SKU:</strong> {previewModal.sku || "N/A"}
                </p>
                <p>
                  <strong>Price:</strong> ₹{previewModal.price.toFixed(2)}
                  {previewModal.discountedPrice ? (
                    <span className="discounted-price">
                      {" "}
                      (Now ₹{previewModal.discountedPrice.toFixed(2)})
                    </span>
                  ) : null}
                </p>
                <p>
                  <strong>Category:</strong> {previewModal.category || "N/A"}
                  {previewModal.subcategory
                    ? ` > ${previewModal.subcategory}`
                    : ""}
                  {previewModal.nestedCategory
                    ? ` > ${previewModal.nestedCategory}`
                    : ""}
                </p>
                <p>
                  <strong>Stock:</strong> {previewModal.stock}{" "}
                  {previewModal.stock === 0 ? (
                    <span className="stock-badge out-of-stock">
                      Out of Stock
                    </span>
                  ) : previewModal.stock <= 5 ? (
                    <span className="stock-badge low-stock">Low Stock</span>
                  ) : (
                    <span className="stock-badge in-stock">In Stock</span>
                  )}
                </p>
                {previewModal.offer && (
                  <p>
                    <strong>Offer:</strong> {previewModal.offer}
                  </p>
                )}
                {previewModal.sizes?.length > 0 && (
                  <p>
                    <strong>Sizes:</strong> {previewModal.sizes.join(", ")}
                  </p>
                )}
                {previewModal.packOf && (
                  <p>
                    <strong>Pack Of:</strong> {previewModal.packOf}
                  </p>
                )}
                {previewModal.seller && (
                  <p>
                    <strong>Seller:</strong> {previewModal.seller}
                  </p>
                )}
                {previewModal.warranty && (
                  <p>
                    <strong>Warranty:</strong> {previewModal.warranty}
                  </p>
                )}
                {previewModal.brand && (
                  <p>
                    <strong>Brand:</strong> {previewModal.brand}
                  </p>
                )}
                {previewModal.weight && (
                  <p>
                    <strong>Weight:</strong>{" "}
                    {previewModal.weightUnit === "g"
                      ? `${previewModal.weight * 1000} g`
                      : `${previewModal.weight} kg`}
                  </p>
                )}
                {previewModal.model && (
                  <p>
                    <strong>Model:</strong> {previewModal.model}
                  </p>
                )}
                <p>
                  <strong>Description:</strong>{" "}
                  {previewModal.description || "N/A"}
                </p>
                {Object.keys(previewModal.specifications || {}).length > 0 && (
                  <div className="specifications-preview">
                    <h4>Specifications</h4>
                    {Object.entries(previewModal.specifications).map(
                      ([section, specs]) => (
                        <div key={section}>
                          <h5>{section}</h5>
                          {Object.entries(specs || {}).map(([key, value]) => (
                            <p key={key} className="spec-item">
                              <span className="spec-key">{key}:</span>{" "}
                              <span className="spec-value">
                                {value || "N/A"}
                              </span>
                            </p>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button
                onClick={() => handleEdit(previewModal)}
                className="edit-btn"
              >
                Edit Product
              </button>
              <button
                onClick={() => handleDuplicate(previewModal)}
                className="duplicate-btn"
              >
                Duplicate
              </button>
              <button
                onClick={() =>
                  toggleProductStatus(previewModal._id, previewModal.isActive)
                }
                className={
                  previewModal.isActive ? "deactivate-btn" : "activate-btn"
                }
              >
                {previewModal.isActive ? "Deactivate" : "Activate"}
              </button>
              <button
                onClick={() => handleDelete(previewModal._id)}
                className="delete-btn"
              >
                Delete
              </button>
              <button
                onClick={() => openVariantModal(previewModal)}
                className="add-variant-btn2"
              >
                Add Variant
              </button>
            </div>
          </div>
        </div>
      )}

      {variantModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={closeVariantModal}>
              ✕
            </button>
            <h2>Add Variant</h2>
            <form onSubmit={handleVariantSubmit} className="variant-form">
              <div className="form-group">
                <label>Main Image</label>
                <input
                  type="file"
                  name="variantMainImage"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {variantFormData?.currentMainImage && (
                  <div className="image-preview">
                    <img
                      src={variantFormData.currentMainImage}
                      alt="Variant Main Preview"
                      onError={(e) => {
                        e.target.src = "/default-product.jpg";
                        e.target.onerror = null;
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Additional Images</label>
                <input
                  type="file"
                  name="variantImages"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
                <div className="additional-images-preview">
                  {(variantFormData?.newImages || []).map((image, index) => (
                    <div
                      key={`variant-new-${index}`}
                      className="image-preview-item"
                    >
                      <img
                        src={image.preview}
                        alt={`Variant New ${index}`}
                        onError={(e) => {
                          e.target.src = "/default-product.jpg";
                          e.target.onerror = null;
                        }}
                      />
                      <button
                        type="button"
                        className="delete-image-btn"
                        onClick={() =>
                          setVariantFormData((prev) => ({
                            ...prev,
                            newImages: prev.newImages.filter(
                              (_, i) => i !== index
                            ),
                          }))
                        }
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Specifications</label>
                {Object.keys(variantFormData?.specifications || {}).length >
                0 ? (
                  Object.entries(variantFormData.specifications).map(
                    ([section, specs]) => (
                      <div key={section} className="specification-section">
                        <h4>{section}</h4>
                        <div className="spec-field">
                          <input
                            type="text"
                            value={section}
                            onChange={(e) =>
                              handleVariantSpecificationSectionNameChange(
                                section,
                                e.target.value
                              )
                            }
                            placeholder="Section Name"
                          />
                        </div>
                        {Object.entries(specs || {}).map(([key, value]) => (
                          <div key={key} className="spec-field">
                            <input
                              type="text"
                              value={key}
                              onChange={(e) =>
                                handleVariantSpecificationChange(
                                  section,
                                  key,
                                  e.target.value,
                                  true
                                )
                              }
                              placeholder="Key (e.g., Color)"
                            />
                            <input
                              type="text"
                              value={value || ""}
                              onChange={(e) =>
                                handleVariantSpecificationChange(
                                  section,
                                  key,
                                  e.target.value
                                )
                              }
                              placeholder="Value (e.g., Red)"
                              required
                            />
                            <button
                              type="button"
                              onClick={() =>
                                removeVariantSpecificationField(section, key)
                              }
                              className="remove-btn"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addVariantSpecificationField(section)}
                          className="add-btn"
                        >
                          Add Specification
                        </button>
                      </div>
                    )
                  )
                ) : (
                  <p>No specifications added.</p>
                )}
                <button
                  type="button"
                  onClick={addVariantSpecificationSection}
                  className="add-btn"
                >
                  Add Specification Section
                </button>
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="save-btn"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Add Variant"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeVariantModal}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManagement;