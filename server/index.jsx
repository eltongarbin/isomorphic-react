import path from 'path';
import express from 'express';
import webpack from 'webpack';
import yields from 'express-yields';
import fs from 'fs-extra';
import { delay } from 'redux-saga';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { argv } from 'optimist';
import { get } from 'request-promise';
import { ConnectedRouter } from 'react-router-redux';
import { Provider } from 'react-redux';
import createHistory from 'history/createMemoryHistory';

import { questions, question } from '../data/api-real-url';
import getStore from '../src/getStore';
import App from '../src/App';

const port = process.env.PORT || 3000;
const app = express();
const useLiveData = argv.useLiveData === 'true';
const useServerRender = argv.useServerRender === 'true';

if (process.env.NODE_ENV === 'development') {
  const config = require('../webpack.config.dev.babel.js').default;
  const compiler = webpack(config);

  app.use(
    require('webpack-dev-middleware')(compiler, {
      noInfo: true,
      stats: {
        assets: false,
        colors: true,
        version: false,
        hash: false,
        timings: false,
        chunks: false,
        chunkModules: false
      }
    })
  );

  app.use(require('webpack-hot-middleware')(compiler));
} else {
  app.use(express.static(path.resolve(__dirname, '../dist')));
}

function* getQuestions() {
  let data;
  if (useLiveData) {
    data = yield get(questions, { gzip: true });
  } else {
    data = yield fs.readFile('./data/mock-questions.json', 'utf-8');
  }

  return JSON.parse(data);
}

function* getQuestion(question_id) {
  let data;
  if (useLiveData) {
    data = yield get(question(question_id), { gzip: true, json: true });
  } else {
    const questions = yield getQuestions();
    const question = questions.items.find(
      (_question) => _question.question_id == question_id
    );

    question.body = `Mock question body: ${question_id}`;
    data = { items: [question] };
  }

  return data;
}

app.get('/api/questions', function*(req, res) {
  const data = yield getQuestions();
  yield delay(150);
  res.json(data);
});

app.get('/api/questions/:id', function*(req, res) {
  const data = yield getQuestion(req.params.id);
  yield delay(150);
  res.json(data);
});

app.get(['/', '/questions/:id'], function*(req, res) {
  let index = yield fs.readFile('./public/index.html', 'utf-8');
  const history = createHistory({
    initialEntries: [req.path]
  });
  const initialState = {
    questions: []
  };

  if (req.params.id) {
    const question_id = req.params.id;
    const response = yield getQuestion(question_id);
    const questionDetails = response.items[0];

    initialState.questions = [{ ...questionDetails, question_id }];
  } else {
    const questions = yield getQuestions();
    initialState.questions = [...questions.items];
  }

  const store = getStore(history, initialState);

  if (useServerRender) {
    const appRendered = renderToString(
      <Provider store={store}>
        <ConnectedRouter history={history}>
          <App />
        </ConnectedRouter>
      </Provider>
    );
    index = index.replace('<%= preloadedApplication %>', appRendered);
  } else {
    index = index.replace(
      '<%= preloadedApplication %>',
      'Please wait while we load the application.'
    );
  }

  res.send(index);
});

app.listen(port, '0.0.0.0', () =>
  console.info(`Listening at http://localhost:${port}`)
);
