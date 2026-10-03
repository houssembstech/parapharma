import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Alert,
  Spinner,
  Image,
  Card,
  Badge,
  InputGroup,
  FloatingLabel
} from "react-bootstrap";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  RotateCcw, 
  X, 
  Upload,
  Trash2
} from "lucide-react";
import { getImageUrl } from "../../utils/imageHelper";

const ProductForm = () => {
  const { token } = useAuth();
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const isEditMode = Boolean(productId);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    price: "",
    stock: "",
    category: "",
    images: [],
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const { data } = await axios.get("http://localhost:5000/api/categories");

        if (Array.isArray(data)) {
          setCategories(data);
        } else if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else {
          setCategories([]);
        }
      } catch (err) {
        setError("⚠️ Failed to load categories");
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch product data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const fetchProduct = async () => {
        setLoadingProduct(true);
        try {
          const { data } = await axios.get(`http://localhost:5000/api/products/${productId}`);
          
          setFormData({
            name: data.name || "",
            slug: data.slug || "",
            description: data.description || "",
            shortDescription: data.shortDescription || "",
            price: data.price || "",
            stock: data.stock || "",
            category: data.category?._id || data.category || "",
            images: data.images || [],
          });
        } catch (err) {
          setError("⚠️ Failed to load product data");
          console.error("Error fetching product:", err);
        } finally {
          setLoadingProduct(false);
        }
      };

      fetchProduct();
    }
  }, [productId, isEditMode]);

  // Auto-generate slug from name (only in add mode)
  useEffect(() => {
    if (!isEditMode && formData.name) {
      setFormData((prev) => ({
        ...prev,
        slug: prev.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, ""),
      }));
    }
  }, [formData.name, isEditMode]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "images" && files.length > 0) {
      const newFiles = Array.from(files);
      setImageFiles(prev => [...prev, ...newFiles]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const removeImage = (index, isFile = false) => {
    if (isFile) {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setSuccess(false);

    if (!token) {
      setError("You must be logged in as admin to manage products");
      setLoading(false);
      return;
    }

    try {
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        } 
      };

      const submitData = new FormData();
      
      // Append form data
      Object.keys(formData).forEach(key => {
        if (key === 'images') {
          // Append existing images as array
          formData.images.forEach(image => {
            submitData.append('images', image);
          });
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Append new image files
      imageFiles.forEach(file => {
        submitData.append('images', file);
      });

      if (isEditMode) {
        await axios.put(
          `http://localhost:5000/api/products/${productId}`,
          submitData,
          config
        );
        setMessage("✅ Product updated successfully! Redirecting...");
      } else {
        await axios.post(
          "http://localhost:5000/api/products",
          submitData,
          config
        );
        setMessage("✅ Product added successfully! Redirecting...");
      }

      setSuccess(true);
      setTimeout(() => navigate("/admin/products"), 2000);

    } catch (err) {
      setError(err.response?.data?.message || 
        `❌ Failed to ${isEditMode ? "update" : "add"} product`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct && isEditMode) {
    return (
      <Container fluid className="py-5">
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="shadow-sm border-0">
              <Card.Body className="text-center py-5">
                <Spinner animation="border" variant="primary" className="mb-3" />
                <h5 className="text-muted">Loading product data...</h5>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8} xl={6}>
          {/* Header Card */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h2 className="h4 mb-1 fw-bold text-dark">
                    {isEditMode ? "Edit Product" : "Add New Product"}
                  </h2>
                  <p className="text-muted mb-0">
                    {isEditMode ? "Update existing product details" : "Create a new product for your store"}
                  </p>
                </div>
                <Badge bg={isEditMode ? "warning" : "success"} className="fs-6">
                  {isEditMode ? "Edit Mode" : "Add Mode"}
                </Badge>
              </div>
              
              <Button 
                variant="outline-primary" 
                onClick={() => navigate("/admin/products")}
                size="sm"
                className="d-flex align-items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Products
              </Button>
            </Card.Body>
          </Card>

          {/* Alerts */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          
          {message && (
            <Alert variant="success">
              {message}
            </Alert>
          )}

          {/* Form Card */}
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col lg={6}>
                    <h5 className="fw-semibold text-dark mb-4 pb-2 border-bottom">
                      Basic Information
                    </h5>

                    <FloatingLabel controlId="name" label="Product Name *" className="mb-3">
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={loadingProduct}
                        placeholder="Enter product name"
                      />
                    </FloatingLabel>

                    <FloatingLabel controlId="slug" label="Slug *" className="mb-3">
                      <Form.Control
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        readOnly={!isEditMode}
                        disabled={loadingProduct}
                        placeholder="Auto-generated slug"
                      />
                    </FloatingLabel>

                    <FloatingLabel controlId="shortDescription" label="Short Description" className="mb-3">
                      <Form.Control
                        type="text"
                        name="shortDescription"
                        value={formData.shortDescription}
                        onChange={handleChange}
                        disabled={loadingProduct}
                        placeholder="Enter brief product description"
                      />
                    </FloatingLabel>

                    <Form.Group className="mb-4" controlId="description">
                      <Form.Label className="fw-medium">Description *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        disabled={loadingProduct}
                        placeholder="Enter detailed product description"
                        style={{ resize: 'vertical' }}
                      />
                    </Form.Group>
                  </Col>

                  <Col lg={6}>
                    <h5 className="fw-semibold text-dark mb-4 pb-2 border-bottom">
                      Pricing & Media
                    </h5>

                    <Row>
                      <Col md={6}>
                        <FloatingLabel controlId="price" label="Price *" className="mb-3">
                          <InputGroup>
                            <InputGroup.Text>$</InputGroup.Text>
                            <Form.Control
                              type="number"
                              step="0.01"
                              min="0"
                              name="price"
                              value={formData.price}
                              onChange={handleChange}
                              required
                              disabled={loadingProduct}
                              placeholder="0.00"
                            />
                          </InputGroup>
                        </FloatingLabel>
                      </Col>
                      <Col md={6}>
                        <FloatingLabel controlId="stock" label="Stock *" className="mb-3">
                          <Form.Control
                            type="number"
                            min="0"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            required
                            disabled={loadingProduct}
                            placeholder="0"
                          />
                        </FloatingLabel>
                      </Col>
                    </Row>

                    <Form.Group className="mb-4" controlId="category">
                      <Form.Label className="fw-medium">Category *</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        disabled={loadingCategories || loadingProduct}
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>
                            {cat.name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    {/* Image Upload Section */}
                    <div className="mb-4">
                      <Form.Label className="fw-medium d-flex align-items-center gap-2">
                        <Upload size={18} />
                        Product Images
                      </Form.Label>
                      
                      <Form.Group className="mb-3">
                        <Form.Control
                          type="file"
                          name="images"
                          accept="image/*"
                          onChange={handleChange}
                          multiple
                          disabled={loadingProduct}
                        />
                        <Form.Text className="text-muted">
                          Select multiple images (JPEG, PNG, GIF, WEBP). Max 5MB per image.
                        </Form.Text>
                      </Form.Group>

                      {/* Image Previews */}
                      {(formData.images.length > 0 || imageFiles.length > 0) && (
                        <Card className="border">
                          <Card.Body className="p-3">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <small className="fw-medium">
                                Images ({formData.images.length + imageFiles.length})
                              </small>
                            </div>
                            
                            <Row className="g-2">
                              {/* Existing Images */}
                              {formData.images.map((image, index) => (
                                <Col key={index} xs={6} sm={4} md={3}>
                                  <Card className="h-100 border">
                                    <div className="position-relative">
                                      <Image
                                        src={getImageUrl(image)}
                                        thumbnail
                                        style={{ 
                                          height: "100px", 
                                          width: "100%",
                                          objectFit: 'cover'
                                        }}
                                        alt={`Product image ${index + 1}`}
                                        onError={(e) => {
                                          e.target.src = 'https://placehold.co/400x400?text=Image';
                                        }}
                                      />
                                      <div className="position-absolute top-0 end-0 p-1">
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          className="p-1"
                                          onClick={() => removeImage(index, false)}
                                          title="Remove Image"
                                        >
                                          <Trash2 size={12} />
                                        </Button>
                                      </div>
                                    </div>
                                  </Card>
                                </Col>
                              ))}
                              
                              {/* New Image Files */}
                              {imageFiles.map((file, index) => (
                                <Col key={`file-${index}`} xs={6} sm={4} md={3}>
                                  <Card className="h-100 border">
                                    <div className="position-relative">
                                      <Image
                                        src={URL.createObjectURL(file)}
                                        thumbnail
                                        style={{ 
                                          height: "100px", 
                                          width: "100%",
                                          objectFit: 'cover'
                                        }}
                                        alt={`New image ${index + 1}`}
                                      />
                                      <div className="position-absolute top-0 end-0 p-1">
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          className="p-1"
                                          onClick={() => removeImage(index, true)}
                                          title="Remove Image"
                                        >
                                          <Trash2 size={12} />
                                        </Button>
                                      </div>
                                      <Badge bg="success" className="position-absolute top-0 start-0 m-1">
                                        New
                                      </Badge>
                                    </div>
                                  </Card>
                                </Col>
                              ))}
                            </Row>
                          </Card.Body>
                        </Card>
                      )}
                    </div>
                  </Col>
                </Row>

                {/* Action Buttons */}
                <div className="border-top pt-4 mt-3">
                  <div className="d-flex gap-3 flex-wrap justify-content-between">
                    <div className="d-flex gap-2 flex-wrap">
                      <Button 
                        type="submit" 
                        variant="primary" 
                        disabled={loading || loadingProduct}
                        className="d-flex align-items-center gap-2 px-4"
                      >
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" />
                            {isEditMode ? "Updating..." : "Adding..."}
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            {isEditMode ? "Update Product" : "Add Product"}
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="outline-secondary" 
                        onClick={() => {
                          setFormData({
                            name: "", slug: "", description: "", shortDescription: "",
                            price: "", stock: "", category: "", images: []
                          });
                          setImageFiles([]);
                        }}
                        disabled={loading}
                        className="d-flex align-items-center gap-2"
                      >
                        <RotateCcw size={18} />
                        {isEditMode ? "Reset" : "Clear"}
                      </Button>
                    </div>
                    
                    <Button 
                      variant="outline-danger" 
                      onClick={() => navigate("/admin/products")}
                      disabled={loading}
                      className="d-flex align-items-center gap-2"
                    >
                      <X size={18} />
                      Cancel
                    </Button>
                  </div>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductForm;
