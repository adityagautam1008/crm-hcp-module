import React from 'react';
import { Provider } from 'react-redux';
import store from './store';
import LogInteractionScreen from './components/LogInteractionScreen';
import './styles/global.css';

export default function App() {
  return (
    <Provider store={store}>
      <LogInteractionScreen />
    </Provider>
  );
}
