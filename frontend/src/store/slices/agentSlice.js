import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const sendChatMessage = createAsyncThunk(
  'agent/sendMessage',
  async ({ message, history }, { rejectWithValue }) => {
    try {
      const res = await api.post('/agent/chat', {
        message,
        conversation_history: history,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Agent error. Please try again.');
    }
  }
);

const agentSlice = createSlice({
  name: 'agent',
  initialState: {
    messages: [],
    loading: false,
    error: null,
    lastToolUsed: null,
  },
  reducers: {
    addUserMessage(state, action) {
      state.messages.push({ role: 'user', content: action.payload });
    },
    clearChat(state) {
      state.messages = [];
      state.error = null;
      state.lastToolUsed = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({ role: 'assistant', content: action.payload.response });
        state.lastToolUsed = action.payload.tool_used;
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.messages.push({ role: 'assistant', content: `⚠️ ${action.payload}` });
      });
  },
});

export const { addUserMessage, clearChat } = agentSlice.actions;
export default agentSlice.reducer;
