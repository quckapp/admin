import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../../services/api/v1';
import type {
  Environment,
  ServiceCategory,
  ServiceUrlConfig,
  InfrastructureConfig,
  FirebaseConfig,
  EnvironmentSummary,
  BulkExportResponse,
} from '../../types/serviceUrls';

interface ServiceUrlsState {
  environments: EnvironmentSummary[];
  services: ServiceUrlConfig[];
  infrastructure: InfrastructureConfig[];
  firebase: FirebaseConfig | null;
  selectedEnv: Environment;
  selectedCategory: string;
  loading: boolean;
  saveLoading: boolean;
  error: string | null;
}

const initialState: ServiceUrlsState = {
  environments: [],
  services: [],
  infrastructure: [],
  firebase: null,
  selectedEnv: 'development',
  selectedCategory: 'overview',
  loading: false,
  saveLoading: false,
  error: null,
};

const BASE = '/admin/service-urls';

export const fetchEnvironments = createAsyncThunk('serviceUrls/fetchEnvironments', async () => {
  const response = await api.get(`${BASE}/environments`);
  return response.data.data;
});

export const fetchServiceUrls = createAsyncThunk(
  'serviceUrls/fetchServiceUrls',
  async ({ env, category }: { env: string; category?: string }) => {
    const params = category ? `?category=${category}` : '';
    const response = await api.get(`${BASE}/environments/${env}/services${params}`);
    return response.data.data;
  }
);

export const fetchInfrastructure = createAsyncThunk(
  'serviceUrls/fetchInfrastructure',
  async (env: string) => {
    const response = await api.get(`${BASE}/environments/${env}/infrastructure`);
    return response.data.data;
  }
);

export const fetchFirebaseConfig = createAsyncThunk(
  'serviceUrls/fetchFirebaseConfig',
  async (env: string) => {
    const response = await api.get(`${BASE}/environments/${env}/firebase`);
    return response.data.data;
  }
);

export const upsertServiceUrl = createAsyncThunk(
  'serviceUrls/upsertServiceUrl',
  async ({ env, data }: { env: string; data: { serviceKey: string; category: string; url: string; description?: string } }) => {
    const response = await api.post(`${BASE}/environments/${env}/services`, data);
    return response.data.data;
  }
);

export const updateServiceUrl = createAsyncThunk(
  'serviceUrls/updateServiceUrl',
  async ({ env, key, data }: { env: string; key: string; data: { url?: string; description?: string; isActive?: boolean } }) => {
    const response = await api.put(`${BASE}/environments/${env}/services/${key}`, data);
    return response.data.data;
  }
);

export const deleteServiceUrl = createAsyncThunk(
  'serviceUrls/deleteServiceUrl',
  async ({ env, key }: { env: string; key: string }) => {
    await api.delete(`${BASE}/environments/${env}/services/${key}`);
    return key;
  }
);

export const upsertInfrastructure = createAsyncThunk(
  'serviceUrls/upsertInfrastructure',
  async ({ env, data }: { env: string; data: { infraKey: string; host: string; port: number; username?: string; connectionString?: string } }) => {
    const response = await api.post(`${BASE}/environments/${env}/infrastructure`, data);
    return response.data.data;
  }
);

export const upsertFirebaseConfig = createAsyncThunk(
  'serviceUrls/upsertFirebaseConfig',
  async ({ env, data }: { env: string; data: { projectId?: string; clientEmail?: string; privateKey?: string; storageBucket?: string } }) => {
    const response = await api.post(`${BASE}/environments/${env}/firebase`, data);
    return response.data.data;
  }
);

export const bulkImport = createAsyncThunk(
  'serviceUrls/bulkImport',
  async ({ env, data }: { env: string; data: any }) => {
    const response = await api.post(`${BASE}/environments/${env}/import`, data);
    return response.data.data;
  }
);

export const bulkExport = createAsyncThunk(
  'serviceUrls/bulkExport',
  async (env: string) => {
    const response = await api.get(`${BASE}/environments/${env}/export`);
    const data: BulkExportResponse = response.data.data;

    // Trigger download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `quckapp-urls-${env}-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return data;
  }
);

export const cloneEnvironment = createAsyncThunk(
  'serviceUrls/cloneEnvironment',
  async ({ source, target }: { source: string; target: string }) => {
    const response = await api.post(`${BASE}/environments/clone`, {
      sourceEnvironment: source,
      targetEnvironment: target,
    });
    return response.data.data;
  }
);

const serviceUrlsSlice = createSlice({
  name: 'serviceUrls',
  initialState,
  reducers: {
    setSelectedEnv: (state, action: PayloadAction<Environment>) => {
      state.selectedEnv = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch environments
      .addCase(fetchEnvironments.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchEnvironments.fulfilled, (state, action) => { state.loading = false; state.environments = action.payload; })
      .addCase(fetchEnvironments.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed to fetch environments'; })
      // Fetch service URLs
      .addCase(fetchServiceUrls.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchServiceUrls.fulfilled, (state, action) => { state.loading = false; state.services = action.payload; })
      .addCase(fetchServiceUrls.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed to fetch service URLs'; })
      // Fetch infrastructure
      .addCase(fetchInfrastructure.pending, (state) => { state.loading = true; })
      .addCase(fetchInfrastructure.fulfilled, (state, action) => { state.loading = false; state.infrastructure = action.payload; })
      .addCase(fetchInfrastructure.rejected, (state, action) => { state.loading = false; state.error = action.error.message || 'Failed to fetch infrastructure'; })
      // Fetch Firebase
      .addCase(fetchFirebaseConfig.fulfilled, (state, action) => { state.firebase = action.payload; })
      .addCase(fetchFirebaseConfig.rejected, (state, action) => { state.error = action.error.message || 'Failed to fetch Firebase config'; })
      // Upsert service URL
      .addCase(upsertServiceUrl.pending, (state) => { state.saveLoading = true; })
      .addCase(upsertServiceUrl.fulfilled, (state, action) => {
        state.saveLoading = false;
        const idx = state.services.findIndex((s) => s.serviceKey === action.payload.serviceKey);
        if (idx >= 0) state.services[idx] = action.payload;
        else state.services.push(action.payload);
      })
      .addCase(upsertServiceUrl.rejected, (state, action) => { state.saveLoading = false; state.error = action.error.message || 'Failed to save service URL'; })
      // Update service URL
      .addCase(updateServiceUrl.fulfilled, (state, action) => {
        const idx = state.services.findIndex((s) => s.serviceKey === action.payload.serviceKey);
        if (idx >= 0) state.services[idx] = action.payload;
      })
      // Delete service URL
      .addCase(deleteServiceUrl.fulfilled, (state, action) => {
        state.services = state.services.filter((s) => s.serviceKey !== action.payload);
      })
      // Upsert infrastructure
      .addCase(upsertInfrastructure.pending, (state) => { state.saveLoading = true; })
      .addCase(upsertInfrastructure.fulfilled, (state, action) => {
        state.saveLoading = false;
        const idx = state.infrastructure.findIndex((i) => i.infraKey === action.payload.infraKey);
        if (idx >= 0) state.infrastructure[idx] = action.payload;
        else state.infrastructure.push(action.payload);
      })
      .addCase(upsertInfrastructure.rejected, (state, action) => { state.saveLoading = false; state.error = action.error.message || 'Failed to save infrastructure'; })
      // Upsert Firebase
      .addCase(upsertFirebaseConfig.pending, (state) => { state.saveLoading = true; })
      .addCase(upsertFirebaseConfig.fulfilled, (state, action) => { state.saveLoading = false; state.firebase = action.payload; })
      .addCase(upsertFirebaseConfig.rejected, (state, action) => { state.saveLoading = false; state.error = action.error.message || 'Failed to save Firebase config'; })
      // Bulk import
      .addCase(bulkImport.pending, (state) => { state.saveLoading = true; })
      .addCase(bulkImport.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.services = action.payload.services;
        state.infrastructure = action.payload.infrastructure;
        state.firebase = action.payload.firebase;
      })
      .addCase(bulkImport.rejected, (state, action) => { state.saveLoading = false; state.error = action.error.message || 'Failed to import'; })
      // Clone
      .addCase(cloneEnvironment.pending, (state) => { state.saveLoading = true; })
      .addCase(cloneEnvironment.fulfilled, (state) => { state.saveLoading = false; })
      .addCase(cloneEnvironment.rejected, (state, action) => { state.saveLoading = false; state.error = action.error.message || 'Failed to clone environment'; });
  },
});

export const { setSelectedEnv, setSelectedCategory, clearError } = serviceUrlsSlice.actions;
export default serviceUrlsSlice.reducer;
