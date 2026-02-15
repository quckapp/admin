import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Link2,
  Server,
  Database,
  Flame,
  Upload,
  Download,
  Copy,
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Save,
  BarChart3,
  Layers,
} from 'lucide-react';
import { Header } from '../components/Layout';
import { Button, Badge, Modal } from '../components/UI';
import {
  fetchEnvironments,
  fetchServiceUrls,
  fetchInfrastructure,
  fetchFirebaseConfig,
  upsertServiceUrl,
  updateServiceUrl,
  deleteServiceUrl,
  upsertInfrastructure,
  upsertFirebaseConfig,
  bulkExport,
  bulkImport,
  cloneEnvironment,
  setSelectedEnv,
  setSelectedCategory,
} from '../store/slices/serviceUrlsSlice';
import { addToast } from '../store/slices/toastSlice';
import type { RootState, AppDispatch } from '../store';
import {
  ENVIRONMENTS,
  ENVIRONMENT_LABELS,
  CATEGORY_LABELS,
  type Environment,
  type ServiceCategory,
  type ServiceUrlConfig,
  type InfrastructureConfig,
} from '../types/serviceUrls';

const CATEGORIES = [
  { id: 'overview', label: 'Overview', icon: BarChart3, description: 'Environment summary' },
  { id: 'SPRING', label: 'Spring Boot', icon: Server, description: '6 services' },
  { id: 'NESTJS', label: 'NestJS', icon: Layers, description: '3 services' },
  { id: 'ELIXIR', label: 'Elixir', icon: Flame, description: '6 services' },
  { id: 'GO', label: 'Go', icon: Server, description: '10 services' },
  { id: 'PYTHON', label: 'Python', icon: Server, description: '8 services' },
  { id: 'infrastructure', label: 'Infrastructure', icon: Database, description: '7 items' },
  { id: 'firebase', label: 'Firebase', icon: Flame, description: 'Firebase config' },
];

export default function ServiceUrls() {
  const dispatch = useDispatch<AppDispatch>();
  const {
    environments,
    services,
    infrastructure,
    firebase,
    selectedEnv,
    selectedCategory,
    loading,
    saveLoading,
  } = useSelector((state: RootState) => state.serviceUrls);

  const [editModal, setEditModal] = useState<{ open: boolean; service?: ServiceUrlConfig }>({ open: false });
  const [editForm, setEditForm] = useState({ serviceKey: '', category: '', url: '', description: '' });
  const [infraModal, setInfraModal] = useState<{ open: boolean; config?: InfrastructureConfig }>({ open: false });
  const [infraForm, setInfraForm] = useState({ infraKey: '', host: '', port: 0, username: '', connectionString: '' });
  const [importModal, setImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [cloneModal, setCloneModal] = useState(false);
  const [cloneTarget, setCloneTarget] = useState<Environment>('qa');
  const [firebaseForm, setFirebaseForm] = useState({ projectId: '', clientEmail: '', privateKey: '', storageBucket: '' });
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [firebaseChanged, setFirebaseChanged] = useState(false);

  useEffect(() => {
    dispatch(fetchEnvironments());
  }, [dispatch]);

  useEffect(() => {
    if (selectedCategory === 'infrastructure') {
      dispatch(fetchInfrastructure(selectedEnv));
    } else if (selectedCategory === 'firebase') {
      dispatch(fetchFirebaseConfig(selectedEnv));
    } else if (selectedCategory !== 'overview') {
      dispatch(fetchServiceUrls({ env: selectedEnv, category: selectedCategory }));
    } else {
      dispatch(fetchServiceUrls({ env: selectedEnv }));
    }
  }, [dispatch, selectedEnv, selectedCategory]);

  useEffect(() => {
    if (firebase) {
      setFirebaseForm({
        projectId: firebase.projectId || '',
        clientEmail: firebase.clientEmail || '',
        privateKey: '',
        storageBucket: firebase.storageBucket || '',
      });
      setFirebaseChanged(false);
    }
  }, [firebase]);

  const handleRefresh = () => {
    dispatch(fetchEnvironments());
    if (selectedCategory === 'infrastructure') {
      dispatch(fetchInfrastructure(selectedEnv));
    } else if (selectedCategory === 'firebase') {
      dispatch(fetchFirebaseConfig(selectedEnv));
    } else {
      dispatch(fetchServiceUrls({ env: selectedEnv, category: selectedCategory === 'overview' ? undefined : selectedCategory }));
    }
  };

  const handleEnvChange = (env: Environment) => {
    dispatch(setSelectedEnv(env));
  };

  const handleCategoryChange = (cat: string) => {
    dispatch(setSelectedCategory(cat));
  };

  // Service URL handlers
  const openEditModal = (service?: ServiceUrlConfig) => {
    if (service) {
      setEditForm({ serviceKey: service.serviceKey, category: service.category, url: service.url, description: service.description || '' });
    } else {
      setEditForm({ serviceKey: '', category: selectedCategory === 'overview' ? 'SPRING' : selectedCategory, url: '', description: '' });
    }
    setEditModal({ open: true, service });
  };

  const handleSaveService = async () => {
    try {
      if (editModal.service) {
        await dispatch(updateServiceUrl({ env: selectedEnv, key: editModal.service.serviceKey, data: { url: editForm.url, description: editForm.description } })).unwrap();
      } else {
        await dispatch(upsertServiceUrl({ env: selectedEnv, data: editForm })).unwrap();
      }
      setEditModal({ open: false });
      dispatch(addToast({ type: 'success', title: 'Saved', message: 'Service URL saved successfully' }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to save' }));
    }
  };

  const handleDeleteService = async (key: string) => {
    if (!confirm(`Delete service URL "${key}" from ${selectedEnv}?`)) return;
    try {
      await dispatch(deleteServiceUrl({ env: selectedEnv, key })).unwrap();
      dispatch(addToast({ type: 'success', title: 'Deleted', message: `${key} removed from ${selectedEnv}` }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to delete' }));
    }
  };

  // Infrastructure handlers
  const openInfraModal = (config?: InfrastructureConfig) => {
    if (config) {
      setInfraForm({ infraKey: config.infraKey, host: config.host, port: config.port, username: config.username || '', connectionString: config.connectionString || '' });
    } else {
      setInfraForm({ infraKey: '', host: '', port: 0, username: '', connectionString: '' });
    }
    setInfraModal({ open: true, config });
  };

  const handleSaveInfra = async () => {
    try {
      await dispatch(upsertInfrastructure({ env: selectedEnv, data: infraForm })).unwrap();
      setInfraModal({ open: false });
      dispatch(addToast({ type: 'success', title: 'Saved', message: 'Infrastructure config saved' }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to save' }));
    }
  };

  // Firebase handlers
  const handleSaveFirebase = async () => {
    try {
      const data: any = { projectId: firebaseForm.projectId, clientEmail: firebaseForm.clientEmail, storageBucket: firebaseForm.storageBucket };
      if (firebaseForm.privateKey) data.privateKey = firebaseForm.privateKey;
      await dispatch(upsertFirebaseConfig({ env: selectedEnv, data })).unwrap();
      setFirebaseChanged(false);
      dispatch(addToast({ type: 'success', title: 'Saved', message: 'Firebase config saved' }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to save Firebase config' }));
    }
  };

  // Bulk handlers
  const handleExport = () => {
    dispatch(bulkExport(selectedEnv));
    dispatch(addToast({ type: 'success', title: 'Exported', message: `Config exported for ${selectedEnv}` }));
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importJson);
      await dispatch(bulkImport({ env: selectedEnv, data })).unwrap();
      setImportModal(false);
      setImportJson('');
      dispatch(fetchEnvironments());
      dispatch(addToast({ type: 'success', title: 'Imported', message: `Config imported for ${selectedEnv}` }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error', message: err.message || 'Invalid JSON or import failed' }));
    }
  };

  const handleClone = async () => {
    try {
      await dispatch(cloneEnvironment({ source: selectedEnv, target: cloneTarget })).unwrap();
      setCloneModal(false);
      dispatch(fetchEnvironments());
      dispatch(addToast({ type: 'success', title: 'Cloned', message: `${selectedEnv} cloned to ${cloneTarget}` }));
    } catch (err: any) {
      dispatch(addToast({ type: 'error', title: 'Error', message: err.message || 'Clone failed' }));
    }
  };

  const currentEnvSummary = environments.find((e) => e.environment === selectedEnv);

  // Filtered services for current category
  const filteredServices = selectedCategory === 'overview'
    ? services
    : services.filter((s) => s.category === selectedCategory);

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg"><Server className="w-5 h-5 text-blue-600" /></div>
            <h4 className="font-semibold text-gray-900">Services</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">{currentEnvSummary?.serviceCount || 0}</p>
          <p className="text-sm text-gray-500 mt-1">configured URLs</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg"><Database className="w-5 h-5 text-purple-600" /></div>
            <h4 className="font-semibold text-gray-900">Infrastructure</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">{currentEnvSummary?.infraCount || 0}</p>
          <p className="text-sm text-gray-500 mt-1">configured endpoints</p>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg"><Flame className="w-5 h-5 text-orange-600" /></div>
            <h4 className="font-semibold text-gray-900">Firebase</h4>
          </div>
          <p className="text-3xl font-bold text-gray-900">{currentEnvSummary?.hasFirebase ? 'Configured' : 'Not Set'}</p>
          <p className="text-sm text-gray-500 mt-1">{currentEnvSummary?.hasFirebase ? 'active' : 'needs setup'}</p>
        </div>
      </div>

      {/* All services table */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Services ({services.length})</h3>
        {renderServiceTable(services)}
      </div>
    </div>
  );

  const renderServiceTable = (items: ServiceUrlConfig[]) => (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Service</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Category</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">URL</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Updated</th>
            <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-12 text-gray-400">
                No service URLs configured for this environment. Click "Add Service" to get started.
              </td>
            </tr>
          ) : (
            items.map((svc) => (
              <tr key={svc.serviceKey} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{svc.serviceKey}</p>
                    {svc.description && <p className="text-xs text-gray-400">{svc.description}</p>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={svc.category === 'SPRING' ? 'success' : svc.category === 'NESTJS' ? 'danger' : svc.category === 'ELIXIR' ? 'purple' : svc.category === 'GO' ? 'info' : 'warning'}>
                    {CATEGORY_LABELS[svc.category as ServiceCategory] || svc.category}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <code className="text-sm text-gray-700 bg-gray-50 px-2 py-1 rounded">{svc.url}</code>
                </td>
                <td className="px-4 py-3">
                  {svc.isActive ? (
                    <span className="inline-flex items-center gap-1 text-green-600 text-sm"><CheckCircle className="w-4 h-4" /> Active</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-gray-400 text-sm"><XCircle className="w-4 h-4" /> Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {svc.updatedAt ? new Date(svc.updatedAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEditModal(svc)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteService(svc.serviceKey)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderInfrastructure = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Infrastructure ({infrastructure.length})</h3>
        <Button size="sm" onClick={() => openInfraModal()}>
          <Plus className="w-4 h-4 mr-1" /> Add Infrastructure
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {infrastructure.map((infra) => (
          <div key={infra.infraKey} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg"><Database className="w-4 h-4 text-purple-600" /></div>
                <div>
                  <p className="font-semibold text-gray-900">{infra.infraKey}</p>
                  <p className="text-xs text-gray-400">{infra.host}:{infra.port}</p>
                </div>
              </div>
              <button onClick={() => openInfraModal(infra)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            {infra.connectionString && (
              <code className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded block truncate">{infra.connectionString}</code>
            )}
            <div className="mt-2 flex items-center gap-2">
              {infra.isActive ? (
                <Badge variant="success" size="sm">Active</Badge>
              ) : (
                <Badge variant="default" size="sm">Inactive</Badge>
              )}
              {infra.username && <Badge variant="info" size="sm">{infra.username}</Badge>}
            </div>
          </div>
        ))}
        {infrastructure.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
            No infrastructure configured. Click "Add Infrastructure" to get started.
          </div>
        )}
      </div>
    </div>
  );

  const renderFirebase = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Firebase Configuration</h3>
        {firebase && (
          <Badge variant={firebase.isActive ? 'success' : 'default'}>
            {firebase.isActive ? 'Active' : 'Inactive'}
          </Badge>
        )}
      </div>
      <div className="bg-white rounded-xl p-6 border border-gray-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
          <input
            type="text"
            value={firebaseForm.projectId}
            onChange={(e) => { setFirebaseForm((prev) => ({ ...prev, projectId: e.target.value })); setFirebaseChanged(true); }}
            placeholder="my-project-id"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client Email</label>
          <input
            type="email"
            value={firebaseForm.clientEmail}
            onChange={(e) => { setFirebaseForm((prev) => ({ ...prev, clientEmail: e.target.value })); setFirebaseChanged(true); }}
            placeholder="firebase-adminsdk@my-project.iam.gserviceaccount.com"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Private Key
            <button onClick={() => setShowPrivateKey(!showPrivateKey)} className="ml-2 text-gray-400 hover:text-gray-600">
              {showPrivateKey ? <EyeOff className="w-4 h-4 inline" /> : <Eye className="w-4 h-4 inline" />}
            </button>
          </label>
          {firebase?.privateKeyMasked && !firebaseForm.privateKey && (
            <p className="text-xs text-gray-400 mb-1">Current key: {firebase.privateKeyMasked}</p>
          )}
          <textarea
            value={firebaseForm.privateKey}
            onChange={(e) => { setFirebaseForm((prev) => ({ ...prev, privateKey: e.target.value })); setFirebaseChanged(true); }}
            placeholder="Leave empty to keep current key. Paste new key to update."
            rows={3}
            className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm ${!showPrivateKey && firebaseForm.privateKey ? 'text-security-disc' : ''}`}
            style={!showPrivateKey && firebaseForm.privateKey ? { WebkitTextSecurity: 'disc' } as any : undefined}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Storage Bucket</label>
          <input
            type="text"
            value={firebaseForm.storageBucket}
            onChange={(e) => { setFirebaseForm((prev) => ({ ...prev, storageBucket: e.target.value })); setFirebaseChanged(true); }}
            placeholder="my-project.appspot.com"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        {firebaseChanged && (
          <div className="pt-2">
            <Button onClick={handleSaveFirebase} loading={saveLoading}>
              <Save className="w-4 h-4 mr-2" /> Save Firebase Config
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  const renderContent = () => {
    if (selectedCategory === 'overview') return renderOverview();
    if (selectedCategory === 'infrastructure') return renderInfrastructure();
    if (selectedCategory === 'firebase') return renderFirebase();

    // Service category view
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            {CATEGORY_LABELS[selectedCategory as ServiceCategory] || selectedCategory} Services ({filteredServices.length})
          </h3>
          <Button size="sm" onClick={() => openEditModal()}>
            <Plus className="w-4 h-4 mr-1" /> Add Service
          </Button>
        </div>
        {renderServiceTable(filteredServices)}
      </div>
    );
  };

  return (
    <div>
      <Header
        title="Service URLs"
        onRefresh={handleRefresh}
        loading={loading}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setImportModal(true)}>
              <Upload className="w-4 h-4 mr-1" /> Import
            </Button>
            <Button size="sm" variant="ghost" onClick={handleExport}>
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setCloneModal(true)}>
              <Copy className="w-4 h-4 mr-1" /> Clone
            </Button>
          </div>
        }
      />

      <div className="p-6">
        {/* Environment Tabs */}
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-100 mb-6">
          {ENVIRONMENTS.map((env) => (
            <button
              key={env}
              onClick={() => handleEnvChange(env)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedEnv === env
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {ENVIRONMENT_LABELS[env]}
            </button>
          ))}
        </div>

        <div className="flex gap-6">
          {/* Category Sidebar */}
          <div className="w-56 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 transition-colors ${
                    selectedCategory === cat.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                  }`}
                >
                  <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id ? 'text-primary-600' : 'text-gray-400'}`} />
                  <div>
                    <p className={`text-sm font-medium ${selectedCategory === cat.id ? 'text-primary-600' : 'text-gray-900'}`}>
                      {cat.label}
                    </p>
                    <p className="text-xs text-gray-400">{cat.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">{renderContent()}</div>
        </div>
      </div>

      {/* Edit Service URL Modal */}
      <Modal isOpen={editModal.open} onClose={() => setEditModal({ open: false })} title={editModal.service ? 'Edit Service URL' : 'Add Service URL'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Key</label>
            <input
              type="text"
              value={editForm.serviceKey}
              onChange={(e) => setEditForm((prev) => ({ ...prev, serviceKey: e.target.value }))}
              disabled={!!editModal.service}
              placeholder="AUTH_SERVICE"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
          </div>
          {!editModal.service && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={editForm.category}
                onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="SPRING">Spring Boot</option>
                <option value="NESTJS">NestJS</option>
                <option value="ELIXIR">Elixir</option>
                <option value="GO">Go</option>
                <option value="PYTHON">Python</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
            <input
              type="text"
              value={editForm.url}
              onChange={(e) => setEditForm((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="http://service-name:8080"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={editForm.description}
              onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setEditModal({ open: false })}>Cancel</Button>
            <Button onClick={handleSaveService} loading={saveLoading}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Infrastructure Modal */}
      <Modal isOpen={infraModal.open} onClose={() => setInfraModal({ open: false })} title={infraModal.config ? 'Edit Infrastructure' : 'Add Infrastructure'} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Infrastructure Key</label>
            <input
              type="text"
              value={infraForm.infraKey}
              onChange={(e) => setInfraForm((prev) => ({ ...prev, infraKey: e.target.value }))}
              disabled={!!infraModal.config}
              placeholder="REDIS"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
              <input
                type="text"
                value={infraForm.host}
                onChange={(e) => setInfraForm((prev) => ({ ...prev, host: e.target.value }))}
                placeholder="redis"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
              <input
                type="number"
                value={infraForm.port}
                onChange={(e) => setInfraForm((prev) => ({ ...prev, port: parseInt(e.target.value) || 0 }))}
                placeholder="6379"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username (optional)</label>
            <input
              type="text"
              value={infraForm.username}
              onChange={(e) => setInfraForm((prev) => ({ ...prev, username: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Connection String (optional)</label>
            <input
              type="text"
              value={infraForm.connectionString}
              onChange={(e) => setInfraForm((prev) => ({ ...prev, connectionString: e.target.value }))}
              placeholder="redis://redis:6379"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setInfraModal({ open: false })}>Cancel</Button>
            <Button onClick={handleSaveInfra} loading={saveLoading}>Save</Button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={importModal} onClose={() => setImportModal(false)} title="Bulk Import Configuration" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Paste JSON configuration to import. This will create or update service URLs, infrastructure, and Firebase config for the <strong>{ENVIRONMENT_LABELS[selectedEnv]}</strong> environment.
          </p>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            rows={12}
            placeholder={`{\n  "services": [\n    { "serviceKey": "AUTH_SERVICE", "category": "SPRING", "url": "http://auth:8080" }\n  ],\n  "infrastructure": [\n    { "infraKey": "REDIS", "host": "redis", "port": 6379 }\n  ],\n  "firebase": {\n    "projectId": "my-project"\n  }\n}`}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setImportModal(false)}>Cancel</Button>
            <Button onClick={handleImport} loading={saveLoading} disabled={!importJson.trim()}>
              <Upload className="w-4 h-4 mr-1" /> Import
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clone Environment Modal */}
      <Modal isOpen={cloneModal} onClose={() => setCloneModal(false)} title="Clone Environment" size="md">
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              This will copy all service URLs, infrastructure configs, and Firebase settings from <strong>{ENVIRONMENT_LABELS[selectedEnv]}</strong> to the target environment. Existing configs in the target will be overwritten.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source Environment</label>
            <input type="text" value={ENVIRONMENT_LABELS[selectedEnv]} disabled className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Environment</label>
            <select
              value={cloneTarget}
              onChange={(e) => setCloneTarget(e.target.value as Environment)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {ENVIRONMENTS.filter((e) => e !== selectedEnv).map((env) => (
                <option key={env} value={env}>{ENVIRONMENT_LABELS[env]}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setCloneModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleClone} loading={saveLoading}>
              <Copy className="w-4 h-4 mr-1" /> Clone to {ENVIRONMENT_LABELS[cloneTarget]}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
