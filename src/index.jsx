import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'react-router-redux';
import createHistory from 'history/createBrowserHistory';

import App from './App';
import getStore from './getStore';

const history = createHistory();
const store = getStore(history);

if (module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    render(NextApp);
  });
}

const render = (_App) => {
  ReactDOM.render(
    <Provider store={store}>
      <ConnectedRouter history={history}>
        <_App />
      </ConnectedRouter>
    </Provider>,
    document.getElementById('AppContainer')
  );
};

store.subscribe(() => {
  const state = store.getState();
  if (state.questions.length > 0) {
    render(App);
  }
});

const fetchDataForLocation = (location) => {
  if (location.pathname === '/') {
    store.dispatch({ type: `REQUEST_FETCH_QUESTIONS` });
  }

  if (location.pathname.includes(`questions`)) {
    store.dispatch({
      type: `REQUEST_FETCH_QUESTION`,
      question_id: location.pathname.split('/')[2]
    });
  }
};

fetchDataForLocation(history.location);

history.listen(fetchDataForLocation);
