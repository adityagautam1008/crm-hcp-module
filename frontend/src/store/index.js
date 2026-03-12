import { configureStore } from '@reduxjs/toolkit';
import interactionReducer from './slices/interactionSlice';
import agentReducer from './slices/agentSlice';

const store = configureStore({
  reducer: {
    interaction: interactionReducer,
    agent: agentReducer,
  },
});

export default store;
