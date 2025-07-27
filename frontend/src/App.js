import React, { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Import A-Frame components (loaded via script tags in public/index.html)
const VRShop = ({ products, shopSettings, onProductClick }) => {
  return (
    <div id="vr-container">
      <a-scene 
        embedded 
        style={{width: '100%', height: '100vh'}}
        vr-mode-ui="enabled: true"
        device-orientation-permission-ui="enabled: true"
        loading-screen="dotsColor: white; backgroundColor: #1a1a2e"
        background={`color: ${shopSettings?.background_color || '#87CEEB'}`}
        fog="type: linear; color: #74b9ff; near: 0; far: 50"
      >
        {/* Assets */}
        <a-assets>
          {/* Fonts */}
          <a-asset-item id="roboto-font" src="https://cdn.aframe.io/fonts/Roboto-msdf.json"></a-asset-item>
          
          {/* Materials */}
          <a-mixin id="floor" 
            geometry="primitive: box; width: 20; height: 0.1; depth: 20"
            material="color: #f8f9fa; roughness: 0.1; metalness: 0.1"
          ></a-mixin>
          
          <a-mixin id="wall"
            geometry="primitive: box; width: 20; height: 6; depth: 0.2"
            material="color: #ffffff; roughness: 0.3"
          ></a-mixin>

          <a-mixin id="pillar"
            geometry="primitive: cylinder; height: 6; radius: 0.3"
            material="color: #e9ecef; roughness: 0.2; metalness: 0.3"
          ></a-mixin>
        </a-assets>

        {/* Lighting */}
        <a-light type="ambient" color="#404040" intensity={shopSettings?.lighting_intensity || 1.0}></a-light>
        <a-light type="directional" position="5 10 5" color="#ffffff" intensity="0.8" 
          light="castShadow: true"
        ></a-light>
        <a-light type="point" position="-5 5 -5" color="#74b9ff" intensity="0.3"></a-light>
        <a-light type="point" position="5 5 5" color="#fd79a8" intensity="0.2"></a-light>

        {/* Shop Environment */}
        {/* Floor */}
        <a-entity mixin="floor" position="0 0 0" shadow="receive: true"></a-entity>
        
        {/* Walls */}
        <a-entity mixin="wall" position="0 3 -10" shadow="receive: true"></a-entity>
        <a-entity mixin="wall" position="0 3 10" shadow="receive: true"></a-entity>
        <a-entity mixin="wall" position="-10 3 0" rotation="0 90 0" shadow="receive: true"></a-entity>
        <a-entity mixin="wall" position="10 3 0" rotation="0 90 0" shadow="receive: true"></a-entity>

        {/* Ceiling */}
        <a-box 
          position="0 6 0" 
          width="20" 
          height="0.1" 
          depth="20"
          material="color: #ffffff; roughness: 0.1"
          shadow="receive: true"
        ></a-box>

        {/* Pillars */}
        <a-entity mixin="pillar" position="-7 3 -7" shadow="cast: true; receive: true"></a-entity>
        <a-entity mixin="pillar" position="7 3 -7" shadow="cast: true; receive: true"></a-entity>
        <a-entity mixin="pillar" position="-7 3 7" shadow="cast: true; receive: true"></a-entity>
        <a-entity mixin="pillar" position="7 3 7" shadow="cast: true; receive: true"></a-entity>

        {/* Welcome Sign */}
        <a-text 
          position="0 4 -9.5"
          value={`Mirë se vini në ${shopSettings?.shop_name || 'Dyqani VR Modern'}`}
          color="#2d3436"
          font="roboto-font"
          width="20"
          align="center"
          shadow="cast: true"
        ></a-text>

        {/* Products */}
        {products.map((product, index) => (
          <a-entity key={product.id} position={`${product.position.x} ${product.position.y} ${product.position.z}`}>
            {/* Product Display Platform */}
            <a-cylinder 
              position="0 0.05 0"
              radius="0.8" 
              height="0.1"
              material="color: #ffffff; roughness: 0.1; metalness: 0.8"
              shadow="cast: true; receive: true"
            ></a-cylinder>

            {/* Product 3D Model or Placeholder */}
            {product.model_3d_url ? (
              <a-entity
                gltf-model={`${BACKEND_URL}${product.model_3d_url}`}
                position="0 0.5 0"
                rotation={`${product.rotation.x} ${product.rotation.y} ${product.rotation.z}`}
                scale={`${product.scale.x} ${product.scale.y} ${product.scale.z}`}
                animation="property: rotation; to: 0 360 0; loop: true; dur: 10000"
                class="product-model"
                shadow="cast: true"
                onClick={() => onProductClick && onProductClick(product)}
              ></a-entity>
            ) : (
              // Placeholder box
              <a-box 
                position="0 0.5 0"
                width="0.8" 
                height="0.8" 
                depth="0.8"
                material="color: #74b9ff; roughness: 0.3; metalness: 0.2"
                animation="property: rotation; to: 0 360 0; loop: true; dur: 8000"
                class="product-placeholder"
                shadow="cast: true"
                onClick={() => onProductClick && onProductClick(product)}
              ></a-box>
            )}

            {/* Product Info Panel */}
            <a-plane 
              position="0 1.8 0"
              width="2" 
              height="1"
              material="color: rgba(255, 255, 255, 0.9); transparent: true"
              geometry="primitive: plane"
              shadow="cast: true"
              look-at="#camera"
            >
              <a-text 
                position="0 0.3 0.01"
                value={product.name}
                color="#2d3436"
                font="roboto-font"
                width="8"
                align="center"
                wrap-count="20"
              ></a-text>
              <a-text 
                position="0 0 0.01"
                value={`€${product.price}`}
                color="#e17055"
                font="roboto-font"
                width="6"
                align="center"
              ></a-text>
              <a-text 
                position="0 -0.3 0.01"
                value={product.category}
                color="#636e72"
                font="roboto-font"
                width="4"
                align="center"
              ></a-text>
            </a-plane>
          </a-entity>
        ))}

        {/* Navigation Instructions */}
        <a-text 
          position="0 0.2 5"
          value="Përdorni WASD ose shigjetat për të lëvizur • Klikoni produktet për detaje"
          color="#636e72"
          font="roboto-font"
          width="8"
          align="center"
        ></a-text>

        {/* Camera with controls */}
        <a-entity id="rig" position="0 1.6 8">
          <a-camera 
            id="camera"
            cursor="rayOrigin: mouse"
            raycaster="objects: .product-model, .product-placeholder"
            look-controls="pointerLockEnabled: true"
            wasd-controls="acceleration: 20"
          >
            <a-cursor 
              geometry="primitive: ring; radiusInner: 0.02; radiusOuter: 0.03"
              material="color: #74b9ff; shader: flat"
              animation__click="property: scale; startEvents: click; from: 0.1 0.1 0.1; to: 1 1 1; dur: 150"
              animation__fusing="property: scale; startEvents: fusing; from: 1 1 1; to: 0.1 0.1 0.1; dur: 1500"
            ></a-cursor>
          </a-camera>
        </a-entity>

        {/* VR Controllers (for VR headsets) */}
        <a-entity 
          id="leftController" 
          hand-controls="hand: left"
          laser-controls="hand: left"
          raycaster="objects: .product-model, .product-placeholder"
        ></a-entity>
        <a-entity 
          id="rightController" 
          hand-controls="hand: right"
          laser-controls="hand: right"
          raycaster="objects: .product-model, .product-placeholder"
        ></a-entity>
      </a-scene>
    </div>
  );
};

const AdminPanel = ({ 
  products, 
  setProducts, 
  shopSettings, 
  setShopSettings, 
  categories,
  analytics 
}) => {
  const [activeTab, setActiveTab] = useState('products');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(null);
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
  });

  const [shopForm, setShopForm] = useState({
    shop_name: '',
    background_color: '#87CEEB',
    lighting_intensity: 1.0
  });

  useEffect(() => {
    if (shopSettings) {
      setShopForm({
        shop_name: shopSettings.shop_name || '',
        background_color: shopSettings.background_color || '#87CEEB',
        lighting_intensity: shopSettings.lighting_intensity || 1.0
      });
    }
  }, [shopSettings]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price)
      };

      let response;
      if (editingProduct) {
        response = await axios.put(`${API}/products/${editingProduct.id}`, productData);
        setProducts(products.map(p => p.id === editingProduct.id ? response.data : p));
      } else {
        response = await axios.post(`${API}/products`, productData);
        setProducts([...products, response.data]);
      }

      setProductForm({
        name: '', description: '', price: '', category: '',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 }
      });
      setEditingProduct(null);
      setShowProductModal(false);
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Jeni i sigurt që doni ta fshini këtë produkt?')) {
      try {
        await axios.delete(`${API}/products/${productId}`);
        setProducts(products.filter(p => p.id !== productId));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      position: product.position,
      rotation: product.rotation,
      scale: product.scale
    });
    setShowProductModal(true);
  };

  const handleFileUpload = async (productId, file, type, format = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (format) formData.append('format', format);

    try {
      const endpoint = type === '3d' ? 
        `${API}/products/${productId}/upload-3d-model` :
        `${API}/products/${productId}/upload-thumbnail`;
      
      const response = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Reload products to show updated URLs
      const productsResponse = await axios.get(`${API}/products`);
      setProducts(productsResponse.data);
      
      setShowUploadModal(null);
      alert('Skedari u ngarkua me sukses!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Gabim gjatë ngarkimit të skedarit');
    }
  };

  const handleShopSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`${API}/shop-settings`, shopForm);
      setShopSettings(response.data);
      alert('Konfigurimi u ruajt me sukses!');
    } catch (error) {
      console.error('Error updating shop settings:', error);
    }
  };

  return (
    <div className="admin-panel">
      {/* Tab Navigation */}
      <div className="tab-nav">
        <button 
          className={activeTab === 'products' ? 'active' : ''} 
          onClick={() => setActiveTab('products')}
        >
          Produktet ({products.length})
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''} 
          onClick={() => setActiveTab('settings')}
        >
          Konfigurimi
        </button>
        <button 
          className={activeTab === 'analytics' ? 'active' : ''} 
          onClick={() => setActiveTab('analytics')}
        >
          Statistikat
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div className="tab-content">
          <div className="tab-header">
            <h2>Menaxhimi i Produkteve</h2>
            <button className="btn-primary" onClick={() => setShowProductModal(true)}>
              + Shto Produkt
            </button>
          </div>

          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {product.thumbnail_url ? (
                    <img src={`${BACKEND_URL}${product.thumbnail_url}`} alt={product.name} />
                  ) : (
                    <div className="placeholder-image">📦</div>
                  )}
                </div>
                
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="category">{product.category}</p>
                  <p className="price">€{product.price}</p>
                  <p className="description">{product.description}</p>
                  
                  <div className="model-status">
                    {product.model_3d_url ? (
                      <span className="has-model">✅ Ka model 3D ({product.model_3d_format})</span>
                    ) : (
                      <span className="no-model">❌ Nuk ka model 3D</span>
                    )}
                  </div>
                </div>

                <div className="product-actions">
                  <button 
                    className="btn-edit" 
                    onClick={() => handleEditProduct(product)}
                  >
                    Modifiko
                  </button>
                  <button 
                    className="btn-upload" 
                    onClick={() => setShowUploadModal(product.id)}
                  >
                    Ngarko Skedar
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDeleteProduct(product.id)}
                  >
                    Fshi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="tab-content">
          <h2>Konfigurimi i Dyqanit</h2>
          
          <form onSubmit={handleShopSettingsSubmit} className="settings-form">
            <div className="form-group">
              <label>Emri i Dyqanit:</label>
              <input 
                type="text"
                value={shopForm.shop_name}
                onChange={(e) => setShopForm({...shopForm, shop_name: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Ngjyra e Sfondit:</label>
              <input 
                type="color"
                value={shopForm.background_color}
                onChange={(e) => setShopForm({...shopForm, background_color: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Intensiteti i Dritës:</label>
              <input 
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={shopForm.lighting_intensity}
                onChange={(e) => setShopForm({...shopForm, lighting_intensity: parseFloat(e.target.value)})}
              />
              <span>{shopForm.lighting_intensity}</span>
            </div>

            <button type="submit" className="btn-primary">Ruaj Konfigurimin</button>
          </form>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="tab-content">
          <h2>Statistikat e Dyqanit</h2>
          
          <div className="analytics-cards">
            <div className="analytics-card">
              <h3>Produktet Totale</h3>
              <div className="big-number">{analytics?.total_products || 0}</div>
            </div>
            
            <div className="analytics-card">
              <h3>Kategoritë</h3>
              <div className="big-number">{analytics?.total_categories || 0}</div>
            </div>
            
            <div className="analytics-card">
              <h3>Me Modele 3D</h3>
              <div className="big-number">{analytics?.products_with_3d_models || 0}</div>
            </div>
            
            <div className="analytics-card">
              <h3>Përqindja e Plotësuar</h3>
              <div className="big-number">{Math.round(analytics?.completion_rate || 0)}%</div>
            </div>
          </div>

          <div className="categories-list">
            <h3>Kategoritë</h3>
            {categories?.map(cat => (
              <div key={cat.name} className="category-item">
                <span>{cat.name}</span>
                <span>{cat.count} produkte</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingProduct ? 'Modifiko Produktin' : 'Shto Produkt të Ri'}</h3>
            
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Emri:</label>
                <input 
                  type="text"
                  value={productForm.name}
                  onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Përshkrimi:</label>
                <textarea 
                  value={productForm.description}
                  onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Çmimi (€):</label>
                <input 
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Kategoria:</label>
                <input 
                  type="text"
                  value={productForm.category}
                  onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                  required
                />
              </div>

              <div className="position-controls">
                <h4>Pozicioni në VR (X, Y, Z):</h4>
                <div className="xyz-inputs">
                  <input 
                    type="number"
                    placeholder="X"
                    value={productForm.position.x}
                    onChange={(e) => setProductForm({
                      ...productForm, 
                      position: {...productForm.position, x: parseFloat(e.target.value) || 0}
                    })}
                  />
                  <input 
                    type="number"
                    placeholder="Y"
                    value={productForm.position.y}
                    onChange={(e) => setProductForm({
                      ...productForm, 
                      position: {...productForm.position, y: parseFloat(e.target.value) || 0}
                    })}
                  />
                  <input 
                    type="number"
                    placeholder="Z"
                    value={productForm.position.z}
                    onChange={(e) => setProductForm({
                      ...productForm, 
                      position: {...productForm.position, z: parseFloat(e.target.value) || 0}
                    })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setShowProductModal(false);
                  setEditingProduct(null);
                  setProductForm({
                    name: '', description: '', price: '', category: '',
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 }
                  });
                }}>
                  Anulo
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Ruaj Ndryshimet' : 'Krijo Produktin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Ngarko Skedarë për Produktin</h3>
            
            <div className="upload-options">
              <div className="upload-section">
                <h4>Model 3D:</h4>
                <input 
                  type="file"
                  accept=".gltf,.glb,.obj,.fbx,.dae,.stl"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const format = file.name.split('.').pop().toLowerCase();
                      handleFileUpload(showUploadModal, file, '3d', format);
                    }
                  }}
                />
                <small>Formate: GLTF, GLB, OBJ, FBX, DAE, STL</small>
              </div>

              <div className="upload-section">
                <h4>Thumbnail:</h4>
                <input 
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileUpload(showUploadModal, file, 'thumbnail');
                    }
                  }}
                />
                <small>Formate: JPG, PNG, WebP</small>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowUploadModal(null)}>
                Mbyll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('vr'); // 'vr' or 'admin'
  const [products, setProducts] = useState([]);
  const [shopSettings, setShopSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load products
      const productsResponse = await axios.get(`${API}/products`);
      setProducts(productsResponse.data);

      // Load shop settings
      const settingsResponse = await axios.get(`${API}/shop-settings`);
      setShopSettings(settingsResponse.data);

      // Load categories
      const categoriesResponse = await axios.get(`${API}/categories`);
      setCategories(categoriesResponse.data);

      // Load analytics
      const analyticsResponse = await axios.get(`${API}/analytics`);
      setAnalytics(analyticsResponse.data);

    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
  };

  return (
    <div className="App">
      {/* Navigation Header */}
      <div className="app-header">
        <div className="header-content">
          <h1>🕶️ {shopSettings?.shop_name || 'Dyqani VR Modern'}</h1>
          <div className="view-toggle">
            <button 
              className={currentView === 'vr' ? 'active' : ''} 
              onClick={() => setCurrentView('vr')}
            >
              Pamja VR
            </button>
            <button 
              className={currentView === 'admin' ? 'active' : ''} 
              onClick={() => setCurrentView('admin')}
            >
              Paneli Admin
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {currentView === 'vr' ? (
        <VRShop 
          products={products} 
          shopSettings={shopSettings}
          onProductClick={handleProductClick}
        />
      ) : (
        <AdminPanel 
          products={products}
          setProducts={setProducts}
          shopSettings={shopSettings}
          setShopSettings={setShopSettings}
          categories={categories}
          analytics={analytics}
        />
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal product-detail-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedProduct.name}</h3>
            <div className="product-detail">
              {selectedProduct.thumbnail_url && (
                <img 
                  src={`${BACKEND_URL}${selectedProduct.thumbnail_url}`} 
                  alt={selectedProduct.name} 
                />
              )}
              <div className="product-info">
                <p><strong>Çmimi:</strong> €{selectedProduct.price}</p>
                <p><strong>Kategoria:</strong> {selectedProduct.category}</p>
                <p><strong>Përshkrimi:</strong> {selectedProduct.description}</p>
                {selectedProduct.model_3d_url && (
                  <p><strong>Model 3D:</strong> ✅ ({selectedProduct.model_3d_format})</p>
                )}
              </div>
            </div>
            <button onClick={() => setSelectedProduct(null)}>Mbyll</button>
          </div>
        </div>
      )}

      {/* VR Instructions */}
      {currentView === 'vr' && (
        <div className="vr-instructions">
          <div className="instructions-content">
            <h4>🎮 Kontrollet:</h4>
            <p><strong>PC:</strong> WASD ose shigjetat për lëvizje • Mouse për të parë rreth e rrotull</p>
            <p><strong>Mobile:</strong> Lëvizni telefonin për të parë • Touch për të klikuar</p>
            <p><strong>VR:</strong> Përdorni kontrollerët për navigim dhe ndërveprim</p>
            <button onClick={() => document.querySelector('a-scene').enterVR()}>
              Hyni në VR 🕶️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;