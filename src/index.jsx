import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import App from './App';
import getStore from './getStore';

const store = getStore();
const fetchDataForLocation = () => {
  store.dispatch({ type: 'REQUEST_FETCH_QUESTIONS' });
};

const render = (_App) => {
  ReactDOM.render(
    <Provider store={store}>
      <_App />
    </Provider>,
    document.getElementById('AppContainer')
  );
};

if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    render(NextApp);
  });
}

render(App);
fetchDataForLocation();
