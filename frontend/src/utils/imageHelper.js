// Helper function to get complete image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return '/api/placeholder/300/300'; // Fallback placeholder
  }

  // If it's already a full URL, return as is
  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // If it's a base64 image, return as is
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  // If it's a blob URL (from file upload), return as is
  if (imagePath.startsWith('blob:')) {
    return imagePath;
  }

  // For relative paths, prepend the backend URL
  const baseUrl = 'http://localhost:5000'; // Hardcoded base URL
  
  // Ensure the path starts with a slash
  const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  
  return `${baseUrl}${normalizedPath}`;
};

// Helper to check if image loads successfully
export const checkImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
};