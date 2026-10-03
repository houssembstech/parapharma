import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import AdminSidebar from '../../components/Layout/AdminSidebar';
import AdminMobileHeader from '../../components/Layout/AdminMobileHeader';
import { FiUsers, FiSearch, FiCalendar, FiEye, FiEdit, FiTrash2, FiUserPlus } from 'react-icons/fi';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editUser, setEditUser] = useState(null);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const usersPerPage = 10;

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Stats for sidebar
  const [stats] = useState({
    totalProducts: 145,
    totalOrders: 328,
    totalCustomers: 1250,
    recentOrders: [],
    stockStatus: {
      outOfStock: 12,
      lowStock: 8,
      inStock: 125,
      total: 145
    }
  });

  const { user: currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (currentUser?.role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchUsers();
  }, [isAuthenticated, currentUser, navigate]);

  const fetchUsers = async () => {
    try {
      setError('');
      const response = await adminAPI.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Erreur lors du chargement des utilisateurs');
      
      // Fallback mock data for development
      if (error.response?.status === 401) {
        setError('Vous devez être connecté en tant qu\'administrateur');
      } else {
        setUsers([
          {
            _id: '001',
            name: 'Ahmed Ben Ali',
            email: 'ahmed@email.com',
            phone: '+216 98 123 456',
            role: 'admin',
            status: 'active',
            createdAt: new Date('2024-01-15').toISOString(),
          },
          {
            _id: '002',
            name: 'Fatima Saidi',
            email: 'fatima@email.com',
            phone: '+216 25 987 654',
            role: 'customer',
            status: 'active',
            createdAt: new Date('2024-01-14').toISOString(),
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminAPI.updateUserStatus(userId, newStatus);
      setUsers(users.map(user =>
        user._id === userId ? { ...user, status: newStatus } : user
      ));
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;
    
    try {
      await adminAPI.deleteUser(userId);
      setUsers(users.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleEditUser = (user) => {
    setEditUser({...user});
  };

  const handleUpdateUser = async () => {
    try {
      const { _id, name, email, phone, role, status } = editUser;
      await adminAPI.updateUser(_id, { name, email, phone, role, status });
      setUsers(users.map(user => user._id === _id ? editUser : user));
      setEditUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Erreur lors de la mise à jour de l\'utilisateur');
    }
  };

  const getStatusBadgeClass = (status) => {
    return status === 'active' ? 'bg-success' : 'bg-danger';
  };

  const filteredUsers = users.filter(user => {
    const matchesRole = !selectedRole || user.role === selectedRole;
    const matchesSearch = !searchTerm ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Check if user is admin, if not show access denied
  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">
          <h4>Accès refusé</h4>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-fluid py-5" style={{ background: "#f8fdf9" }}>
        <div className="text-center">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3 text-muted">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4" style={{ background: "#f8fdf9", minHeight: "100vh" }}>
      <div className="row">
        {/* Reusable Sidebar */}
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          stats={stats}
        />

        {/* Main Content */}
        <div className={`${sidebarCollapsed ? 'col-lg-11' : 'col-lg-10'} col-md-9`}>
          {/* Mobile Header */}
          <AdminMobileHeader 
            title="Gestion des Utilisateurs" 
            onMenuClick={() => setSidebarOpen(true)}
          />

          {/* Header */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body py-3">
              <div className="row align-items-center">
                <div className="col-md-6 mb-3 mb-md-0">
                  <h2 className="h5 mb-1 fw-bold text-success">
                    <FiUsers className="me-2" />
                    Gestion des Utilisateurs
                  </h2>
                  <p className="text-muted small mb-0">
                    Gérez les comptes utilisateurs et permissions
                  </p>
                </div>
                
                
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-warning alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError('')}></button>
            </div>
          )}

          {/* Filters */}
          <div className="card shadow-sm border-0 rounded-4 mb-4">
            <div className="card-body">
              <div className="row align-items-end">
                <div className="col-md-6 mb-3 mb-md-0">
                  <label className="form-label fw-medium text-success">Rechercher</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <FiSearch size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-success"
                      placeholder="Nom ou email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4 mb-3 mb-md-0">
                  <label className="form-label fw-medium text-success">Rôle</label>
                  <select
                    className="form-select border-success"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <option value="">Tous les rôles</option>
                    <option value="admin">Administrateur</option>
                    <option value="customer">Client</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedRole('');
                      setCurrentPage(1);
                    }}
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-header bg-white border-0 rounded-top-4 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-success d-flex align-items-center">
                <FiUsers className="me-2" />
                Utilisateurs ({filteredUsers.length})
              </h5>
              <div className="text-muted small">
                Page {currentPage} sur {totalPages}
              </div>
            </div>
            
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="border-0">Utilisateur</th>
                      <th className="border-0">Email</th>
                      <th className="border-0 text-center">Rôle</th>
                      
                      <th className="border-0">Date d'inscription</th>
                      <th className="border-0 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map(user => (
                      <tr key={user._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-success rounded-circle d-flex align-items-center justify-content-center text-white me-3"
                                 style={{ width: '40px', height: '40px' }}>
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-medium">{user.name}</div>
                              <small className="text-muted">{user.phone}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-muted">{user.email}</span>
                        </td>
                        <td className="text-center">
                          <span className={`badge ${user.role === 'admin' ? 'bg-warning' : 'bg-info'}`}>
                            {user.role === 'admin' ? 'Administrateur' : 'Client'}
                          </span>
                        </td>
                        
                        <td>
                          <small className="text-muted">
                            {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex justify-content-center gap-1">
                            <button
                              className="btn btn-sm btn-outline-info d-flex align-items-center"
                              onClick={() => setSelectedUser(user)}
                            >
                              <FiEye size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-warning d-flex align-items-center"
                              onClick={() => handleEditUser(user)}
                            >
                              <FiEdit size={14} />
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger d-flex align-items-center"
                              onClick={() => handleDeleteUser(user._id)}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {currentUsers.length === 0 && (
                  <div className="text-center py-5 text-muted">
                    <FiUsers size={32} className="mb-2" />
                    <h5>Aucun utilisateur trouvé</h5>
                    <small>
                      {searchTerm || selectedRole
                        ? 'Essayez de modifier vos critères de recherche.'
                        : 'Les utilisateurs apparaîtront ici une fois enregistrés.'}
                    </small>
                  </div>
                )}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="card-footer bg-white border-0">
                <div className="d-flex justify-content-between align-items-center">
                  <small className="text-muted">
                    Affichage de {currentUsers.length} utilisateur(s) sur {filteredUsers.length}
                  </small>
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => setCurrentPage(p => p - 1)}
                      disabled={currentPage === 1}
                    >
                      Précédent
                    </button>
                    <span className="btn btn-sm btn-light">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-success"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-success">Détails de l'Utilisateur</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setSelectedUser(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-4">
                  <div className="bg-success rounded-circle d-flex align-items-center justify-content-center text-white mx-auto mb-3"
                       style={{ width: '80px', height: '80px' }}>
                    {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <h5>{selectedUser.name}</h5>
                  <p className="text-muted">{selectedUser.email}</p>
                </div>
                
                <div className="row">
                  <div className="col-6">
                    <strong>Téléphone:</strong>
                    <p>{selectedUser.phone}</p>
                  </div>
                  <div className="col-6">
                    <strong>Rôle:</strong>
                    <p>
                      <span className={`badge ${selectedUser.role === 'admin' ? 'bg-warning' : 'bg-info'}`}>
                        {selectedUser.role === 'admin' ? 'Administrateur' : 'Client'}
                      </span>
                    </p>
                  </div>
                  <div className="col-6">
                    <strong>Statut:</strong>
                    <p>
                      <span className={`badge ${getStatusBadgeClass(selectedUser.status)}`}>
                        {selectedUser.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </p>
                  </div>
                  <div className="col-6">
                    <strong>Inscription:</strong>
                    <p>{new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setSelectedUser(null)}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title text-success">Modifier l'Utilisateur</h5>
                <button type="button" className="btn-close" onClick={() => setEditUser(null)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nom</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editUser.name}
                    onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={editUser.email}
                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Téléphone</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editUser.phone}
                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Rôle</label>
                  <select
                    className="form-select"
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                  >
                    <option value="admin">Administrateur</option>
                    <option value="customer">Client</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Statut</label>
                  <select
                    className="form-select"
                    value={editUser.status}
                    onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditUser(null)}>Annuler</button>
                <button className="btn btn-success" onClick={handleUpdateUser}>Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="d-md-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 1040 }}
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default UserManagement;
