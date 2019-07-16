/**
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const functions = require('firebase-functions');
const {dialogflow, HtmlResponse} = require('actions-on-google');

const app = dialogflow({debug: true});

app.middleware((conv, framework) => {
  // Get project ID and use it to obtain the host URL
  // This may need to change if the game is not hosted on Firebase
  const functionUrl = framework.express.request.headers.host
  // us-central1-my-project-id.cloudfunctions.net
  // ->
  // my-project-id
  conv.data.projectId = functionUrl.match(/us-central1-(.*)?\.cloudfunctions.net/)[1]
})

app.intent('Default Welcome Intent', (conv) => {
  conv.ask('Welcome to the game!');
  conv.ask(new HtmlResponse({
    url: `https://${conv.data.projectId}.firebaseapp.com`,
    suppress: true
  }));
});

app.intent('Default Fallback Intent', (conv) => {
  conv.ask('I do not understand. Can you repeat?');
  conv.ask(new HtmlResponse({
    data: {}
  }));
});

app.intent('Action Move', (conv, {direction, steps}) => {
  conv.ask('What do you do next?');
  conv.ask(new HtmlResponse({
    data: {
      move: {
        direction,
        steps: parseInt(steps)
      }
    }
  }));
});

app.intent('Menu selection', (conv, {index, text}) => {
  conv.ask('What do you do next?');
  conv.ask(new HtmlResponse({
    data: {
       menu: {
        index,
        text
       }
    }
  }));
});

app.intent('Open menu', (conv) => {
  conv.ask('What do you do next?');
  conv.ask(new HtmlResponse({
    data: {
      open: 'menu'
    }
  }));
});

app.intent('Close menu', (conv) => {
  conv.ask('What do you do next?');
  conv.ask(new HtmlResponse({
    data: {
      close: true
    }
  }));
});

app.intent('Next', (conv) => {
  conv.ask('What do you do next?');
  conv.ask(new HtmlResponse({
    data: {
      command: 'enter'
    }
  }));
});

app.intent('Select', (conv) => {
  conv.ask('What do you do next?');
  conv.ask(new HtmlResponse({
    data: {
      command: 'enter'
    }
  }));
});

app.intent('Close menu', (conv) => {
  conv.ask('What do you do next?');
  conv.ask(new HtmlResponse({
    data: {
      command: 'close'
    }
  }));
});

app.intent('Look direction', (conv, {direction}) => {
  conv.ask('What do you do next?');
  conv.ask(new HtmlResponse({
    data: {
      direction
    }
  }));
});

exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
