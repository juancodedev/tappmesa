// src/components/Admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('customers');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      // Por ahora, usar datos simulados hasta que se implementen las APIs
      const mockCustomers = [
        {
          id: 1,
          restaurantName: 'Café Central',
          restaurantType: 'Café',
          ownerName: 'Juan Pérez',
          email: 'cafe-central@cafe-central.com',
          phone: '+56912345001',
          address: 'Av. Providencia 1234',
          city: 'Santiago',
          numberOfTables: 8,
          plan: 'trial',
          trialEndDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          restaurantName: 'Tetería Luna',
          restaurantType: 'Tetería',
          ownerName: 'María González',
          email: 'teteria-luna@teteria-luna.com',
          phone: '+56912345002',
          address: 'Av. Las Condes 5678',
          city: 'Las Condes',
          numberOfTables: 6,
          plan: 'basic',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setCustomers(mockCustomers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCustomerTrial = async (customerId, action, days = null) => {
    try {
      // Simular actualización exitosa por ahora
      console.log(`Trial update: ${action} for customer ${customerId}`, { days });
      fetchCustomers(); // Recargar datos
      alert('Trial actualizado exitosamente (simulado)');
    } catch (error) {
      console.error('Error updating trial:', error);
      alert('Error al actualizar el trial');
    }
  };

  const updateCustomerPlan = async (customerId, newPlan) => {
    try {
      // Simular actualización exitosa por ahora
      console.log(`Plan update: ${newPlan} for customer ${customerId}`);
      fetchCustomers();
      alert('Plan actualizado exitosamente (simulado)');
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Error al actualizar el plan');
    }
  };

  const getTrialStatus = (customer) => {
    if (customer.plan !== 'trial') return null;
    
    const now = new Date();
    const trialEnd = new Date(customer.trialEndDate);
    const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
    
    if (daysLeft <= 0) {
      return { status: 'expired', daysLeft: 0, color: 'red' };
    } else if (daysLeft <= 7) {
      return { status: 'expiring', daysLeft, color: 'orange' };
    } else {
      return { status: 'active', daysLeft, color: 'green' };
    }
  };

  const CustomerModal = ({ customer, onClose }) => {
    const [extendDays, setExtendDays] = useState(30);
    const trialInfo = getTrialStatus(customer);

    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Gestionar Cliente: {customer.restaurantName}</h3>
            <button onClick={onClose} className="close-btn">×</button>
          </div>

          <div className="customer-details">
            <div className="detail-section">
              <h4>Información del Restaurante</h4>
              <p><strong>Nombre:</strong> {customer.restaurantName}</p>
              <p><strong>Tipo:</strong> {customer.restaurantType}</p>
              <p><strong>Dirección:</strong> {customer.address}, {customer.city}</p>
              <p><strong>Teléfono:</strong> {customer.phone}</p>
              <p><strong>Mesas:</strong> {customer.numberOfTables}</p>
            </div>

            <div className="detail-section">
              <h4>Información del Propietario</h4>
              <p><strong>Nombre:</strong> {customer.ownerName}</p>
              <p><strong>Email:</strong> {customer.email}</p>
              <p><strong>Registro:</strong> {new Date(customer.createdAt).toLocaleDateString()}</p>
            </div>

            <div className="detail-section">
              <h4>Estado del Plan</h4>
              <p><strong>Plan Actual:</strong> 
                <span className={`plan-badge ${customer.plan}`}>
                  {customer.plan.toUpperCase()}
                </span>
              </p>
              
              {customer.plan === 'trial' && trialInfo && (
                <p><strong>Días restantes:</strong> 
                  <span style={{ color: trialInfo.color, fontWeight: 'bold' }}>
                    {trialInfo.daysLeft} días
                  </span>
                </p>
              )}
              
              <p><strong>Último acceso:</strong> {
                customer.lastLogin ? new Date(customer.lastLogin).toLocaleDateString() : 'Nunca'
              }</p>
            </div>
          </div>

          <div className="modal-actions">
            {customer.plan === 'trial' && (
              <div className="trial-actions">
                <h4>Gestionar Trial</h4>
                <div className="action-group">
                  <input
                    type="number"
                    value={extendDays}
                    onChange={(e) => setExtendDays(parseInt(e.target.value))}
                    min="1"
                    max="365"
                    placeholder="Días"
                  />
                  <button 
                    className="btn-success"
                    onClick={() => updateCustomerTrial(customer.id, 'extend', extendDays)}
                  >
                    Extender Trial
                  </button>
                </div>
                
                <button 
                  className="btn-warning"
                  onClick={() => updateCustomerTrial(customer.id, 'reset')}
                >
                  Reiniciar Trial (60 días)
                </button>
                
                <button 
                  className="btn-danger"
                  onClick={() => updateCustomerTrial(customer.id, 'end')}
                >
                  Terminar Trial
                </button>
              </div>
            )}

            <div className="plan-actions">
              <h4>Cambiar Plan</h4>
              <div className="plan-buttons">
                <button 
                  className="btn-plan trial"
                  onClick={() => updateCustomerPlan(customer.id, 'trial')}
                  disabled={customer.plan === 'trial'}
                >
                  Trial
                </button>
                <button 
                  className="btn-plan basic"
                  onClick={() => updateCustomerPlan(customer.id, 'basic')}
                  disabled={customer.plan === 'basic'}
                >
                  Básico
                </button>
                <button 
                  className="btn-plan professional"
                  onClick={() => updateCustomerPlan(customer.id, 'professional')}
                  disabled={customer.plan === 'professional'}
                >
                  Profesional
                </button>
                <button 
                  className="btn-plan enterprise"
                  onClick={() => updateCustomerPlan(customer.id, 'enterprise')}
                  disabled={customer.plan === 'enterprise'}
                >
                  Enterprise
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomersTab = () => (
    <div className="customers-tab">
      <div className="tab-header">
        <h2>Gestión de Clientes</h2>
        <div className="stats-row">
          <div className="stat-card">
            <h3>{customers.filter(c => c.plan === 'trial').length}</h3>
            <p>En Trial</p>
          </div>
          <div className="stat-card">
            <h3>{customers.filter(c => c.plan !== 'trial').length}</h3>
            <p>Pagando</p>
          </div>
          <div className="stat-card">
            <h3>{customers.filter(c => {
              const trial = getTrialStatus(c);
              return trial && trial.daysLeft <= 7;
            }).length}</h3>
            <p>Expiran Pronto</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading">Cargando clientes...</div>
      ) : (
        <div className="customers-table">
          <table>
            <thead>
              <tr>
                <th>Restaurante</th>
                <th>Propietario</th>
                <th>Plan</th>
                <th>Estado Trial</th>
                <th>Registro</th>
                <th>Último Acceso</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => {
                const trialInfo = getTrialStatus(customer);
                return (
                  <tr key={customer.id}>
                    <td>
                      <div className="restaurant-info">
                        <strong>{customer.restaurantName}</strong>
                        <small>{customer.restaurantType}</small>
                      </div>
                    </td>
                    <td>
                      <div className="owner-info">
                        <strong>{customer.ownerName}</strong>
                        <small>{customer.email}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`plan-badge ${customer.plan}`}>
                        {customer.plan.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {trialInfo ? (
                        <span 
                          className={`trial-status ${trialInfo.status}`}
                          style={{ color: trialInfo.color }}
                        >
                          {trialInfo.daysLeft} días
                        </span>
                      ) : (
                        <span className="no-trial">-</span>
                      )}
                    </td>
                    <td>{new Date(customer.createdAt).toLocaleDateString()}</td>
                    <td>{customer.lastLogin ? new Date(customer.lastLogin).toLocaleDateString() : 'Nunca'}</td>
                    <td>
                      <button 
                        className="btn-manage"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerModal(true);
                        }}
                      >
                        Gestionar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="analytics-tab">
      <h2>Análisis y Métricas</h2>
      
      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Registros por Mes</h3>
          <div className="chart-placeholder">
            <p>📊 Gráfico de registros mensuales</p>
            <div className="chart-data">
              <div className="bar" style={{height: '60%'}}><span>Ene</span></div>
              <div className="bar" style={{height: '80%'}}><span>Feb</span></div>
              <div className="bar" style={{height: '45%'}}><span>Mar</span></div>
              <div className="bar" style={{height: '90%'}}><span>Abr</span></div>
              <div className="bar" style={{height: '70%'}}><span>May</span></div>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Conversión Trial → Pago</h3>
          <div className="conversion-stats">
            <div className="conversion-rate">
              <span className="rate">68%</span>
              <p>Tasa de conversión</p>
            </div>
            <div className="conversion-details">
              <p>Trials completados: <strong>45</strong></p>
              <p>Conversiones: <strong>31</strong></p>
              <p>Promedio industria: <strong>45%</strong></p>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Distribución de Planes</h3>
          <div className="plan-distribution">
            <div className="plan-pie">
              <div className="slice trial" style={{transform: 'rotate(0deg)'}}>Trial</div>
              <div className="slice basic" style={{transform: 'rotate(120deg)'}}>Básico</div>
              <div className="slice professional" style={{transform: 'rotate(240deg)'}}>Pro</div>
            </div>
            <div className="plan-legend">
              <div><span className="color trial"></span> Trial (40%)</div>
              <div><span className="color basic"></span> Básico (35%)</div>
              <div><span className="color professional"></span> Pro (20%)</div>
              <div><span className="color enterprise"></span> Enterprise (5%)</div>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Actividad Reciente</h3>
          <div className="recent-activity">
            <div className="activity-item">
              <span className="activity-icon">👋</span>
              <div>
                <p><strong>Restaurante Milano</strong> se registró</p>
                <small>Hace 2 horas</small>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">💰</span>
              <div>
                <p><strong>La Bella Vista</strong> actualizó a plan Pro</p>
                <small>Hace 4 horas</small>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-icon">⚠️</span>
              <div>
                <p><strong>Café Central</strong> trial expira en 3 días</p>
                <small>Hace 1 día</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="settings-tab">
      <h2>Configuraciones</h2>
      
      <div className="settings-sections">
        <div className="settings-card">
          <h3>Configuración de Trials</h3>
          <div className="setting-item">
            <label>Duración por defecto del trial (días)</label>
            <input type="number" defaultValue="60" min="1" max="365" />
          </div>
          <div className="setting-item">
            <label>Notificación de expiración (días antes)</label>
            <input type="number" defaultValue="7" min="1" max="30" />
          </div>
          <div className="setting-item">
            <label>Extensión automática para clientes activos</label>
            <input type="checkbox" />
          </div>
          <button className="btn-primary">Guardar Cambios</button>
        </div>

        <div className="settings-card">
          <h3>Notificaciones</h3>
          <div className="setting-item">
            <label>Email cuando un trial está por expirar</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <label>Email cuando un cliente se registra</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <label>Email resumen semanal</label>
            <input type="checkbox" />
          </div>
          <button className="btn-primary">Guardar Cambios</button>
        </div>

        <div className="settings-card">
          <h3>Administradores</h3>
          <div className="admin-list">
            <div className="admin-item">
              <span>📧 {user?.email}</span>
              <span className="role">Super Admin</span>
            </div>
          </div>
          <button className="btn-secondary">Agregar Administrador</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Panel de Administración - TappMesa</h1>
        <div className="admin-info">
          <span>👋 Hola, {user?.ownerName || 'Admin'}</span>
          <button className="btn-logout" onClick={() => window.location.href = '/dashboard'}>
            Ir al Dashboard
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          👥 Clientes
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Análisis
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Configuraciones
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'customers' && renderCustomersTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {showCustomerModal && selectedCustomer && (
        <CustomerModal 
          customer={selectedCustomer} 
          onClose={() => {
            setShowCustomerModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}
    </div>
  );
}

// src/components/Dashboard/TrialBanner.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function TrialBanner() {
  const { user, trialInfo, checkTrialStatus } = useAuth();
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (user && user.plan === 'trial') {
      checkTrialStatus(user.id);
    }
  }, [user]);

  if (!user || user.plan !== 'trial' || !trialInfo) {
    return null;
  }

  const daysLeft = Math.ceil((new Date(trialInfo.endDate) - new Date()) / (1000 * 60 * 60 * 24));
  const isExpiring = daysLeft <= 7;
  const isExpired = daysLeft <= 0;

  const getBannerClass = () => {
    if (isExpired) return 'trial-banner expired';
    if (isExpiring) return 'trial-banner expiring';
    return 'trial-banner active';
  };

  const getBannerMessage = () => {
    if (isExpired) {
      return '⚠️ Tu período de prueba ha expirado. Actualiza tu plan para continuar usando TappMesa.';
    }
    if (isExpiring) {
      return `⏰ Tu período de prueba expira en ${daysLeft} días. ¡Actualiza ahora y mantén todas las funcionalidades!`;
    }
    return `🎉 Tienes ${daysLeft} días restantes en tu período de prueba gratuita.`;
  };

  return (
    <div className={getBannerClass()}>
      <div className="banner-content">
        <span className="banner-message">{getBannerMessage()}</span>
        <div className="banner-actions">
          {!isExpired && (
            <button 
              className="btn-upgrade"
              onClick={() => setShowUpgrade(true)}
            >
              Ver Planes
            </button>
          )}
          {isExpired && (
            <button 
              className="btn-upgrade urgent"
              onClick={() => setShowUpgrade(true)}
            >
              Actualizar Ahora
            </button>
          )}
        </div>
      </div>

      {showUpgrade && (
        <div className="upgrade-modal-overlay" onClick={() => setShowUpgrade(false)}>
          <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Actualizar Plan</h3>
              <button onClick={() => setShowUpgrade(false)}>×</button>
            </div>
            <div className="plans-grid">
              <div className="plan-card basic">
                <h4>Básico</h4>
                <div className="price">$29<span>/mesa/mes</span></div>
                <ul>
                  <li>Menú digital QR</li>
                  <li>Sistema de pedidos básico</li>
                  <li>Hasta 5 mesas</li>
                  <li>Soporte por email</li>
                </ul>
                <button className="btn-select-plan">Seleccionar</button>
              </div>
              <div className="plan-card professional featured">
                <div className="popular-badge">Más Popular</div>
                <h4>Profesional</h4>
                <div className="price">$49<span>/mesa/mes</span></div>
                <ul>
                  <li>Todo lo del plan Básico</li>
                  <li>Sistema de reservas</li>
                  <li>Comandas digitales</li>
                  <li>Hasta 20 mesas</li>
                  <li>Pagos integrados</li>
                  <li>Analytics avanzados</li>
                </ul>
                <button className="btn-select-plan">Seleccionar</button>
              </div>
              <div className="plan-card enterprise">
                <h4>Enterprise</h4>
                <div className="price">$99<span>/mesa/mes</span></div>
                <ul>
                  <li>Todo lo del plan Profesional</li>
                  <li>Mesas ilimitadas</li>
                  <li>Personalización completa</li>
                  <li>API personalizada</li>
                  <li>Soporte 24/7</li>
                </ul>
                <button className="btn-select-plan">Contactar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}