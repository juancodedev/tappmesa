import { useState, useEffect } from 'react';
import { 
  Coffee, 
  Plus, 
  Minus, 
  Clock, 
  Star, 
  ShoppingCart, 
  Smartphone,
  Users,
  BarChart3,
  CheckCircle,
  Heart,
  Zap
} from 'lucide-react';

const DemoSection = () => {
  const [activeTab, setActiveTab] = useState('customer');
  const [selectedItem, setSelectedItem] = useState(null);
  const [customizations, setCustomizations] = useState({
    size: 'medium',
    milk: 'regular',
    sugar: 1,
    temp: 'hot'
  });
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [orderStatus, setOrderStatus] = useState('ordering');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Analytics Demo Data
  const [analyticsData, setAnalyticsData] = useState({
    todayOrders: 47,
    revenue: 186750,
    topItem: 'Latte Clásico',
    peakHour: '10:30 AM'
  });

  // Menu Items
  const menuItems = [
    {
      id: 1,
      name: 'Latte Clásico',
      description: 'Espresso suave con leche vaporizada y arte latte',
      price: 3200,
      image: '/api/placeholder/120/120',
      popular: true,
      rating: 4.9,
      time: '3-5 min'
    },
    {
      id: 2,
      name: 'Cappuccino Especial',
      description: 'Espresso intenso con espuma de leche cremosa',
      price: 3500,
      image: '/api/placeholder/120/120',
      popular: false,
      rating: 4.8,
      time: '4-6 min'
    },
    {
      id: 3,
      name: 'Croissant de Almendra',
      description: 'Recién horneado con almendras tostadas',
      price: 2800,
      image: '/api/placeholder/120/120',
      popular: false,
      rating: 4.7,
      time: '1-2 min'
    },
    {
      id: 4,
      name: 'Americano Doble',
      description: 'Doble shot de espresso con agua caliente',
      price: 2500,
      image: '/api/placeholder/120/120',
      popular: true,
      rating: 4.6,
      time: '2-3 min'
    }
  ];

  const tabs = [
    { id: 'customer', name: 'Vista Cliente', icon: Smartphone, desc: 'Experiencia del cliente' },
    { id: 'admin', name: 'Panel Admin', icon: BarChart3, desc: 'Dashboard del dueño' },
    { id: 'barista', name: 'Vista Barista', icon: Users, desc: 'Panel de preparación' }
  ];

  // Add to cart functionality
  const addToCart = () => {
    if (!selectedItem) return;
    
    const cartItem = {
      ...selectedItem,
      customizations: { ...customizations },
      quantity,
      totalPrice: selectedItem.price * quantity,
      id: Date.now()
    };
    
    setCart([...cart, cartItem]);
    setSelectedItem(null);
    setQuantity(1);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // Simulate real-time analytics
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalyticsData(prev => ({
        ...prev,
        todayOrders: prev.todayOrders + Math.floor(Math.random() * 2),
        revenue: prev.revenue + Math.floor(Math.random() * 5000)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const CustomerView = () => (
    <div className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-md mx-auto border">
      {/* Phone Header */}
      <div className="bg-coffee-900 text-coffee-900 p-4 text-center relative">
        <div className="absolute top-2 left-4 w-4 h-1 bg-white/30 rounded-full"></div>
        <div className="absolute top-2 right-4 flex gap-1">
          <div className="w-1 h-1 bg-white/50 rounded-full"></div>
          <div className="w-4 h-1 bg-white/30 rounded-full"></div>
        </div>
        <h3 className="font-bold text-lg mt-2">☕ Café Central</h3>
        <p className="text-coffee-900/70 text-sm">Mesa #7 - Junto a ventana</p>
      </div>

      {/* Menu */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <h4 className="font-bold text-coffee-900 mb-4 flex items-center gap-2">
          <Coffee className="h-5 w-5 text-primary-500" />
          Menú Digital
        </h4>
        
        <div className="space-y-3">
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="border rounded-lg p-3 cursor-pointer hover:border-primary-500 hover:shadow-md transition-all relative"
            >
              {item.popular && (
                <span className="absolute -top-2 -right-2 bg-primary-500 text-coffee-900 text-xs px-2 py-1 rounded-full">
                  Popular ⭐
                </span>
              )}
              
              <div className="flex gap-3">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h5 className="font-semibold text-coffee-900">{item.name}</h5>
                  <p className="text-coffee-600 text-sm mb-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary-500">{formatPrice(item.price)}</span>
                    <div className="flex items-center gap-2 text-xs text-coffee-500">
                      <Star className="h-3 w-3 fill-current text-yellow-400" />
                      {item.rating}
                      <Clock className="h-3 w-3" />
                      {item.time}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-coffee-900">
                🛒 {cart.length} {cart.length === 1 ? 'producto' : 'productos'}
              </span>
              <span className="font-bold text-primary-500">
                {formatPrice(cart.reduce((sum, item) => sum + item.totalPrice, 0))}
              </span>
            </div>
            <button className="w-full mt-2 bg-primary-500 text-coffee-900 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors">
              Enviar Pedido al Barista
            </button>
          </div>
        )}
      </div>

      {/* Customization Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <img 
                src={selectedItem.image} 
                alt={selectedItem.name}
                className="w-24 h-24 rounded-full mx-auto mb-3 object-cover"
              />
              <h3 className="text-xl font-bold text-coffee-900">{selectedItem.name}</h3>
              <p className="text-coffee-600 text-sm">{selectedItem.description}</p>
            </div>

            {/* Customizations */}
            <div className="space-y-4">
              {/* Size */}
              <div>
                <label className="block text-sm font-semibold text-coffee-900 mb-2">Tamaño</label>
                <div className="flex gap-2">
                  {['small', 'medium', 'large'].map((size) => (
                    <button
                      key={size}
                      onClick={() => setCustomizations({...customizations, size})}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                        customizations.size === size
                          ? 'bg-primary-500 text-coffee-900'
                          : 'bg-gray-100 text-coffee-600 hover:bg-gray-200'
                      }`}
                    >
                      {size === 'small' ? 'Pequeño' : size === 'medium' ? 'Mediano' : 'Grande'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Milk */}
              <div>
                <label className="block text-sm font-semibold text-coffee-900 mb-2">Tipo de Leche</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {key: 'regular', label: 'Regular'},
                    {key: 'almond', label: 'Almendra'},
                    {key: 'oat', label: 'Avena'},
                    {key: 'soy', label: 'Soya'}
                  ].map((milk) => (
                    <button
                      key={milk.key}
                      onClick={() => setCustomizations({...customizations, milk: milk.key})}
                      className={`py-2 px-3 rounded-lg text-sm font-medium ${
                        customizations.milk === milk.key
                          ? 'bg-primary-500 text-coffee-900'
                          : 'bg-gray-100 text-coffee-600 hover:bg-gray-200'
                      }`}
                    >
                      {milk.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugar */}
              <div>
                <label className="block text-sm font-semibold text-coffee-900 mb-2">Endulzante</label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCustomizations({...customizations, sugar: Math.max(0, customizations.sugar - 1)})}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 bg-gray-100 rounded-lg font-semibold min-w-[60px] text-center">
                    {customizations.sugar} {customizations.sugar === 1 ? 'sobre' : 'sobres'}
                  </span>
                  <button
                    onClick={() => setCustomizations({...customizations, sugar: Math.min(5, customizations.sugar + 1)})}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-semibold text-coffee-900 mb-2">Temperatura</label>
                <div className="flex gap-2">
                  {[
                    {key: 'hot', label: '🔥 Caliente'},
                    {key: 'warm', label: '☕ Tibio'},
                    {key: 'iced', label: '🧊 Frío'}
                  ].map((temp) => (
                    <button
                      key={temp.key}
                      onClick={() => setCustomizations({...customizations, temp: temp.key})}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                        customizations.temp === temp.key
                          ? 'bg-primary-500 text-coffee-900'
                          : 'bg-gray-100 text-coffee-600 hover:bg-gray-200'
                      }`}
                    >
                      {temp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-semibold text-coffee-900 mb-2">Cantidad</label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 py-2 bg-gray-100 rounded-lg font-semibold min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Total & Actions */}
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-coffee-900">Total:</span>
                <span className="text-xl font-bold text-primary-500">
                  {formatPrice(selectedItem.price * quantity)}
                </span>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold text-coffee-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={addToCart}
                  className="flex-2 py-3 bg-primary-500 text-coffee-900 rounded-lg font-semibold hover:bg-primary-600 flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Agregar al Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-coffee-900 px-4 py-2 rounded-lg flex items-center gap-2 z-50">
          <CheckCircle className="h-4 w-4" />
          ¡Agregado al pedido!
        </div>
      )}
    </div>
  );

  const AdminView = () => (
    <div className="bg-white rounded-2xl p-6 shadow-2xl border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-coffee-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary-500" />
          Dashboard Café Central
        </h3>
        <div className="text-sm text-coffee-600">
          Hoy • {new Date().toLocaleDateString('es-CL')}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-4 rounded-lg border border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-coffee-600 text-sm">Órdenes Hoy</p>
              <p className="text-2xl font-bold text-primary-600">{analyticsData.todayOrders}</p>
            </div>
            <div className="bg-primary-500 p-2 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-coffee-900" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <Zap className="h-3 w-3 text-green-500" />
            <span className="text-green-600">+12% vs ayer</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-coffee-600 text-sm">Ingresos</p>
              <p className="text-2xl font-bold text-green-600">{formatPrice(analyticsData.revenue)}</p>
            </div>
            <div className="bg-green-500 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-coffee-900" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <Zap className="h-3 w-3 text-green-500" />
            <span className="text-green-600">+23% vs ayer</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-coffee-600 text-sm">Producto Top</p>
              <p className="text-lg font-bold text-yellow-600">{analyticsData.topItem}</p>
            </div>
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Star className="h-5 w-5 text-coffee-900" />
            </div>
          </div>
          <div className="text-sm text-coffee-600 mt-2">
            18 vendidos hoy
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-coffee-600 text-sm">Hora Pico</p>
              <p className="text-lg font-bold text-blue-600">{analyticsData.peakHour}</p>
            </div>
            <div className="bg-blue-500 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-coffee-900" />
            </div>
          </div>
          <div className="text-sm text-coffee-600 mt-2">
            23 órdenes/hora
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Chart */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-coffee-900 mb-4">Ventas por Hora</h4>
          <div className="space-y-2">
            {[
              {hour: '8:00', sales: 85, color: 'bg-primary-500'},
              {hour: '9:00', sales: 120, color: 'bg-primary-400'},
              {hour: '10:00', sales: 95, color: 'bg-primary-600'},
              {hour: '11:00', sales: 140, color: 'bg-primary-300'},
              {hour: '12:00', sales: 110, color: 'bg-primary-500'}
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm font-medium text-coffee-600 w-12">{item.hour}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${item.color}`}
                    style={{width: `${(item.sales / 140) * 100}%`}}
                  ></div>
                </div>
                <span className="text-sm font-medium text-coffee-900 w-16">{formatPrice(item.sales * 100)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-coffee-900 mb-4">Productos Más Vendidos</h4>
          <div className="space-y-3">
            {[
              {name: 'Latte Clásico', sales: 18, trend: '+5'},
              {name: 'Americano Doble', sales: 15, trend: '+2'},
              {name: 'Cappuccino Especial', sales: 12, trend: '+3'},
              {name: 'Croissant Almendra', sales: 8, trend: '+1'}
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <span className="font-medium text-coffee-900">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-coffee-900">{item.sales}</span>
                  <span className="text-green-500 text-sm">({item.trend})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-coffee-900 mb-4">Órdenes Recientes</h4>
        <div className="space-y-2">
          {[
            {id: '#047', table: 'Mesa 7', items: 'Latte + Croissant', total: 6000, status: 'Preparando', time: '2 min'},
            {id: '#046', table: 'Mesa 3', items: 'Americano x2', total: 5000, status: 'Listo', time: '5 min'},
            {id: '#045', table: 'Mesa 12', items: 'Cappuccino + Pastel', total: 7500, status: 'Entregado', time: '8 min'}
          ].map((order, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm font-bold text-coffee-900">{order.id}</span>
                <span className="text-coffee-600">{order.table}</span>
                <span className="text-coffee-900">{order.items}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold">{formatPrice(order.total)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === 'Preparando' ? 'bg-yellow-100 text-yellow-700' :
                  order.status === 'Listo' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {order.status}
                </span>
                <span className="text-coffee-500 text-sm">{order.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const BaristaView = () => (
    <div className="bg-white rounded-2xl p-6 shadow-2xl border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-coffee-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-primary-500" />
          Panel del Barista
        </h3>
        <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-700 font-medium text-sm">En línea</span>
        </div>
      </div>

      {/* Queue Status */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
          <div className="text-2xl font-bold text-yellow-600">4</div>
          <div className="text-yellow-700 text-sm">En Cola</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
          <div className="text-2xl font-bold text-blue-600">2</div>
          <div className="text-blue-700 text-sm">Preparando</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-600">3</div>
          <div className="text-green-700 text-sm">Listos</div>
        </div>
      </div>

      {/* Orders Queue */}
      <div className="space-y-4">
        <h4 className="font-semibold text-coffee-900">Cola de Preparación</h4>
        
        {/* Active Orders */}
        {[
          {
            id: '#047',
            table: 'Mesa 7',
            customer: 'Ana García',
            items: [
              {name: 'Latte Clásico', customizations: 'Mediano, Leche de Avena, 1 azúcar, Caliente', priority: 'high'},
              {name: 'Croissant de Almendra', customizations: 'Calentar', priority: 'low'}
            ],
            time: '2:30',
            status: 'preparing',
            avatar: '/api/placeholder/40/40'
          },
          {
            id: '#048',
            table: 'Mesa 3',
            customer: 'Carlos M.',
            items: [
              {name: 'Americano Doble', customizations: 'Grande, Sin azúcar, Extra caliente', priority: 'medium'},
              {name: 'Americano Doble', customizations: 'Mediano, 2 azúcar, Caliente', priority: 'medium'}
            ],
            time: '1:15',
            status: 'pending',
            avatar: '/api/placeholder/40/40'
          },
          {
            id: '#049',
            table: 'Mesa 12',
            customer: 'María S.',
            items: [
              {name: 'Cappuccino Especial', customizations: 'Pequeño, Leche regular, Sin azúcar, Arte latte', priority: 'high'}
            ],
            time: '0:45',
            status: 'ready',
            avatar: '/api/placeholder/40/40'
          }
        ].map((order, index) => (
          <div key={index} className={`p-4 rounded-lg border-2 ${
            order.status === 'preparing' ? 'border-blue-300 bg-blue-50' :
            order.status === 'ready' ? 'border-green-300 bg-green-50' :
            'border-yellow-300 bg-yellow-50'
          }`}>
            {/* Order Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <img 
                  src={order.avatar} 
                  alt={order.customer}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-coffee-900">{order.id}</span>
                    <span className="text-coffee-600">•</span>
                    <span className="font-medium text-coffee-900">{order.table}</span>
                  </div>
                  <span className="text-coffee-600 text-sm">{order.customer}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm text-coffee-600">Tiempo</div>
                  <div className="font-bold text-coffee-900">{order.time}</div>
                </div>
                
                {order.status === 'preparing' && (
                  <button className="bg-blue-500 text-coffee-900 px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors">
                    Marcar Listo
                  </button>
                )}
                
                {order.status === 'pending' && (
                  <button className="bg-yellow-500 text-coffee-900 px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors">
                    Comenzar
                  </button>
                )}
                
                {order.status === 'ready' && (
                  <button className="bg-green-500 text-coffee-900 px-4 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors">
                    Entregar
                  </button>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-2">
              {order.items.map((item, itemIndex) => (
                <div key={itemIndex} className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-coffee-900 flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-primary-500" />
                      {item.name}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.priority === 'high' ? 'bg-red-100 text-red-700' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {item.priority === 'high' ? '🔥 Urgente' : 
                       item.priority === 'medium' ? '⚡ Normal' : '📋 Básico'}
                    </span>
                  </div>
                  <p className="text-coffee-600 text-sm">{item.customizations}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex gap-3">
          <button className="flex-1 bg-primary-500 text-coffee-900 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2">
            <Zap className="h-4 w-4" />
            Pausa Pedidos (5 min)
          </button>
          <button className="flex-1 border-2 border-coffee-300 text-coffee-700 py-3 rounded-lg font-semibold hover:border-primary-500 hover:text-primary-500 transition-colors">
            Llamar Soporte
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <section id="demo-section" className="py-20 bg-gradient-to-br from-cream-200 via-white to-cream-100 relative overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Smartphone className="text-primary-500 h-8 w-8" />
            <span className="text-coffee-600 font-medium">Demo Interactiva</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-coffee-900 mb-6">
            Experimenta <span className="text-primary-500">TappMesa</span> en Acción
          </h2>
          <p className="text-xl text-coffee-600 max-w-3xl mx-auto leading-relaxed mb-8">
            Explora todas las funcionalidades desde la perspectiva del cliente, 
            administrador y barista. Una experiencia completa e integrada.
          </p>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="bg-white rounded-2xl p-2 shadow-lg border border-cream-200">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-primary-500 text-coffee-900 shadow-md'
                      : 'text-coffee-600 hover:text-primary-500 hover:bg-primary-50'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-semibold">{tab.name}</div>
                    <div className="text-xs opacity-75">{tab.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'customer' && <CustomerView />}
          {activeTab === 'admin' && <AdminView />}
          {activeTab === 'barista' && <BaristaView />}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="bg-coffee-dark rounded-2xl p-8 text-coffee-900 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-coffee-900 via-primary-500/20 to-coffee-900 opacity-50"></div>
            <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-4">
                ¿Listo para digitalizar tu cafetería? ☕
              </h3>
              <p className="text-coffee-900/90 max-w-2xl mx-auto text-lg leading-relaxed mb-6">
                Únete a las 250+ cafeterías que ya transformaron su negocio con TappMesa. 
                Registro gratuito, configuración en minutos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-primary-500 text-coffee-900 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2">
                  <Coffee className="h-5 w-5" />
                  Registrar Mi Cafetería Gratis
                </button>
                <button className="border-2 border-white/30 text-coffee-900 px-8 py-4 rounded-lg text-lg font-semibold hover:border-primary-300 hover:text-primary-300 transition-colors">
                  Agendar Demo Personalizada
                </button>
              </div>
              <p className="text-coffee-900/60 text-sm mt-4">
                🚀 Configuración en 15 minutos • ✅ Sin tarjeta de crédito • 📞 Soporte en español
              </p>
            </div>
          </div>
        </div>

        {/* Floating Decorations */}
        <div className="absolute top-20 left-10 text-6xl opacity-10 animate-float">☕</div>
        <div className="absolute bottom-40 right-20 text-4xl opacity-10 animate-float-delay">📱</div>
        <div className="absolute top-60 right-10 text-5xl opacity-10 animate-float">⚡</div>
        <div className="absolute bottom-20 left-20 text-3xl opacity-10 animate-float">🚀</div>
      </div>
    </section>
  );
};

export default DemoSection;