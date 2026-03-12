import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// ─── Async Thunks ─────────────────────────────────────────────

export const fetchInteractions = createAsyncThunk(
  'interaction/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/interactions');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch interactions');
    }
  }
);

export const fetchHCPs = createAsyncThunk(
  'interaction/fetchHCPs',
  async (search = '', { rejectWithValue }) => {
    try {
      const res = await api.get(`/hcps?search=${search}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch HCPs');
    }
  }
);

export const createInteraction = createAsyncThunk(
  'interaction/create',
  async (interactionData, { rejectWithValue }) => {
    try {
      const res = await api.post('/interactions', interactionData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to create interaction');
    }
  }
);

export const updateInteraction = createAsyncThunk(
  'interaction/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/interactions/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update interaction');
    }
  }
);

export const getFollowupSuggestions = createAsyncThunk(
  'interaction/followup',
  async (interactionId, { rejectWithValue }) => {
    try {
      const res = await api.post(`/tools/followup-suggestions/${interactionId}`);
      return { id: interactionId, suggestions: res.data.suggestions };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to get suggestions');
    }
  }
);

export const analyzeSentiment = createAsyncThunk(
  'interaction/sentiment',
  async ({ interactionId, text }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/tools/analyze-sentiment/${interactionId}?text=${encodeURIComponent(text || '')}`);
      return { id: interactionId, sentiment: res.data.inferred_sentiment };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to analyze sentiment');
    }
  }
);

// ─── Initial State ────────────────────────────────────────────

const initialFormState = {
  hcp_name: '',
  hcp_id: null,
  interaction_type: 'Meeting',
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  attendees: '',
  topics_discussed: '',
  materials_shared: [],
  samples_distributed: [],
  sentiment: 'neutral',
  outcomes: '',
  follow_up_actions: '',
};

const initialState = {
  interactions: [],
  hcps: [],
  form: initialFormState,
  loading: false,
  hcpsLoading: false,
  error: null,
  successMessage: null,
  lastCreatedId: null,
  followupSuggestions: [],
};

// ─── Slice ────────────────────────────────────────────────────

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    updateFormField(state, action) {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    resetForm(state) {
      state.form = initialFormState;
      state.successMessage = null;
      state.error = null;
      state.followupSuggestions = [];
    },
    clearMessages(state) {
      state.successMessage = null;
      state.error = null;
    },
    setFormFromAgent(state, action) {
      // Allow agent chat to pre-fill form fields
      state.form = { ...state.form, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    // Fetch interactions
    builder
      .addCase(fetchInteractions.pending, (state) => { state.loading = true; })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.interactions = action.payload;
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch HCPs
    builder
      .addCase(fetchHCPs.pending, (state) => { state.hcpsLoading = true; })
      .addCase(fetchHCPs.fulfilled, (state, action) => {
        state.hcpsLoading = false;
        state.hcps = action.payload;
      })
      .addCase(fetchHCPs.rejected, (state, action) => {
        state.hcpsLoading = false;
      });

    // Create interaction
    builder
      .addCase(createInteraction.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createInteraction.fulfilled, (state, action) => {
        state.loading = false;
        state.interactions.unshift(action.payload);
        state.lastCreatedId = action.payload.id;
        state.successMessage = `Interaction with ${action.payload.hcp_name} logged successfully! ID: #${action.payload.id}`;
        state.form = initialFormState;
      })
      .addCase(createInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update interaction
    builder
      .addCase(updateInteraction.fulfilled, (state, action) => {
        const index = state.interactions.findIndex(i => i.id === action.payload.id);
        if (index !== -1) state.interactions[index] = action.payload;
        state.successMessage = 'Interaction updated successfully!';
      });

    // Follow-up suggestions
    builder
      .addCase(getFollowupSuggestions.fulfilled, (state, action) => {
        state.followupSuggestions = action.payload.suggestions;
      });

    // Sentiment analysis
    builder
      .addCase(analyzeSentiment.fulfilled, (state, action) => {
        state.form.sentiment = action.payload.sentiment;
        const index = state.interactions.findIndex(i => i.id === action.payload.id);
        if (index !== -1) state.interactions[index].sentiment = action.payload.sentiment;
      });
  },
});

export const { updateFormField, resetForm, clearMessages, setFormFromAgent } = interactionSlice.actions;
export default interactionSlice.reducer;
