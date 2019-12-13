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

//=============================================================================
// Canvas.js
//=============================================================================

/*:
 * @plugindesc Add support for Google Assistant through Interactive Canvas.
 * @author Google Inc.
 *
 * @help This plugin does not provide plugin commands.
 */

const CANVAS_JS_SRC = './js/libs/canvas.js';
const MOVEMENT_TIME = 250; // ms

(function() {
  // When the plugin loads, inject canvas into the webpage
  const scriptDomElement = document.createElement('script');
  scriptDomElement.setAttribute('type', 'text/javascript');
  scriptDomElement.setAttribute('src', CANVAS_JS_SRC);
  document.body.appendChild(scriptDomElement);
  scriptDomElement.addEventListener('load', () => {
    const callbacks = {
      onUpdate(state) {
        console.log('onUpdate', JSON.stringify(state));
        if ('move' in state) {
          /**
           * {
           *   steps:
           *     if > 0, exact number of steps.
           *     if < 0, move until we hit something
           *     default: -1
           *   direction:
           *     'forward' or a number direction
           *        (2 - Down, 4 - Left, 6 - Right, 8 - Up)
           * }
           */
          state.move.steps = state.move.steps || -1;
          if (state.move.steps > 0) {
            for (let i = 0; i < state.move.steps; i++) {
              setTimeout(() => {
                if (state.move.direction === 'forward') {
                  $gamePlayer.moveForward();
                } else {
                  $gamePlayer.moveStraight(parseInt(state.move.direction));
                }
              }, i * MOVEMENT_TIME);
            }
          } else if (state.move.steps < 0) {
            // Move until we hit something
            const stepInterval = setInterval(() => {
              if (state.move.direction === 'forward') {
                $gamePlayer.moveForward();
              } else {
                $gamePlayer.moveStraight(parseInt(state.move.direction));
              }
              if (!$gamePlayer.isMovementSucceeded()) {
                clearInterval(stepInterval);
              }
            }, MOVEMENT_TIME);
          }
        }
        if ('direction' in state) {
          /**
           * {
           *   direction: numerical direction
           *    (2 - Down, 4 - Left, 6 - Right, 8 - Up)
           * }
           */
          $gamePlayer.setDirection(state.direction);
        }
        if ('fallbackText' in state) {
          // Maybe this is related to a menu
          // Update the state and process it below
          state.menu = {
            text: state.fallbackText,
          };
        }
        if ('menu' in state) {
          /**
           * {
           *   text?: The text that is in the menu
           *   index?: The index of the item menu
           * }
           */
          if ('text' in state.menu) {
            // Search each command for a clickable item
            // The window that is in focus
            let commandWindow;
            // List of items in the menu
            // {
            //   name: Label of item
            //   symbol: Unique identifier of item in list
            // }
            let list;
            // function (symbol, symbolIndex) that selects the item
            let handler;
            if (SceneManager._scene._numberWindow &&
                SceneManager._scene._numberWindow.active) {
              // Used when selected a number of something,
              // like number of items to buy/sell
              commandWindow = SceneManager._scene._numberWindow;
              // Set the list to be a set of numbers between
              // 0 and max items that can be bought
              list = [];
              const max = SceneManager._scene._numberWindow._max;
              for (let i = 0; i <= max; i++) {
                list.push({
                  name: i.toString(),
                  symbol: i.toString(),
                });
              }
              handler = (symbol) => {
                SceneManager._scene._numberWindow._number = parseInt(symbol);
                SceneManager._scene._numberWindow.drawNumber();
              };
            } else if (SceneManager._scene._buyWindow &&
                SceneManager._scene._buyWindow.active) {
              // Buying items from a merchant
              commandWindow = SceneManager._scene._buyWindow;
              list = commandWindow._data.map((buyItem) => {
                return {
                  name: buyItem.name,
                  symbol: buyItem.symbol,
                };
              });
              handler = (_, symbolIndex) => {
                commandWindow.select(symbolIndex);
                commandWindow._handlers.ok();
              };
            } else if (SceneManager._scene._sellWindow &&
                SceneManager._scene._sellWindow.active) {
              // Selling items to a merchant
              commandWindow = SceneManager._scene._sellWindow;
              list = commandWindow._data.map((sellItem) => {
                return {
                  name: sellItem.name,
                  symbol: sellItem.symbol,
                };
              });
              handler = (_, symbolIndex) => {
                commandWindow.select(symbolIndex);
                commandWindow._handlers.ok();
              };
            } else if (SceneManager._scene._commandWindow &&
                SceneManager._scene._commandWindow.active) {
              // Title menu, in-game menu
              commandWindow = SceneManager._scene._commandWindow;
              list = commandWindow._list;
              handler = (symbol) => commandWindow._handlers[symbol]();
            } else if (SceneManager._scene._enemyWindow &&
                SceneManager._scene._enemyWindow.active) {
              // Select which enemy to target in-battle
              commandWindow = SceneManager._scene._enemyWindow;
              list = commandWindow._enemies.map((enemy) => {
                return {
                  name: enemy.battlerName(),
                  symbol: enemy.battlerName(),
                };
              });
              handler = (_, symbolIndex) => {
                commandWindow.select(symbolIndex);
                commandWindow._handlers.ok();
                // Mark window as inactive for next character
                SceneManager._scene._enemyWindow.active = false;
                // Mark windows as inactive for end of a turn
                SceneManager._scene._actorCommandWindow.active = false;
                SceneManager._scene._partyCommandWindow.active = false;
              };
            } else if (SceneManager._scene._actorCommandWindow &&
                SceneManager._scene._actorCommandWindow.active) {
              // Individual character battle menu
              commandWindow = SceneManager._scene._actorCommandWindow;
              list = commandWindow._list;
              handler = (symbol) => commandWindow._handlers[symbol]();
            } else if (SceneManager._scene._partyCommandWindow &&
                SceneManager._scene._partyCommandWindow.active) {
              // Primary battle menu
              commandWindow = SceneManager._scene._partyCommandWindow;
              list = commandWindow._list;
              handler = (symbol) => commandWindow._handlers[symbol]();
              // Mark window as inactive to complete a turn
              SceneManager._scene._partyCommandWindow.active = false;
            } else if (SceneManager._scene._categoryWindow &&
                SceneManager._scene._categoryWindow.active) {
              // In-game item menu
              commandWindow = SceneManager._scene._categoryWindow;
              list = commandWindow._list;
              handler = (symbol) => {
                commandWindow.selectSymbol(symbol);
                commandWindow._handlers.ok();
              };
            } else if (SceneManager._scene._skillTypeWindow &&
                SceneManager._scene._skillTypeWindow.active) {
              // In-game skills type menu
              commandWindow = SceneManager._scene._skillTypeWindow;
              list = commandWindow._list;
              handler = (symbol) => commandWindow._handlers[symbol]();
            } else if (SceneManager._scene._messageWindow &&
                SceneManager._scene._messageWindow._choiceWindow &&
                SceneManager._scene._messageWindow._choiceWindow.active) {
              // Choice window, for selecting a choice
              commandWindow = SceneManager._scene._messageWindow._choiceWindow;
              list = commandWindow._list;
              handler = (_, symbolIndex) => {
                commandWindow.select(symbolIndex);
                commandWindow.processOk();
              };
            } else if (SceneManager._scene._itemWindow &&
                SceneManager._scene._itemWindow.active) {
              // Item window, for selecting an item during in-game menu
              commandWindow = SceneManager._scene._itemWindow;
              list = commandWindow._data.map((item) => {
                return {
                  name: item.name,
                  symbol: item.name,
                };
              });
              handler = (_, symbolIndex) => {
                commandWindow.select(symbolIndex);
                commandWindow.processOk();
              };
            } else if (SceneManager._scene._messageWindow &&
                SceneManager._scene._messageWindow._itemWindow &&
                SceneManager._scene._messageWindow._itemWindow.active) {
              // Item window, for selecting an item during a message
              commandWindow = SceneManager._scene._messageWindow._itemWindow;
              list = commandWindow._data.map((buyItem) => {
                return {
                  name: buyItem.name,
                  symbol: buyItem.name,
                };
              });
              handler = (_, symbolIndex) => {
                commandWindow.select(symbolIndex);
                commandWindow.processOk();
              };
            } else if (SceneManager._scene._messageWindow &&
                SceneManager._scene._messageWindow._numberWindow &&
                SceneManager._scene._messageWindow._numberWindow.active) {
              // Number window, for selecting a number of something
              commandWindow = SceneManager._scene._messageWindow._numberWindow;
              // List is a series of numbers between 0 and 10^(Max Digits)
              list = [];
              for (let i = 0; i < Math.pow(10, commandWindow._maxDigits); i++) {
                list.push({
                  name: i.toString(),
                  symbol: i.toString(),
                });
              }
              handler = (symbol) => {
                // The only way one can manipulate this window
                // is by incrementing/decrementing
                const numberGoal = parseInt(symbol);
                if (commandWindow._number < numberGoal) {
                  // Increment until we get there
                  for (let i = commandWindow._number; i < numberGoal; i++) {
                    commandWindow.changeDigit(true);
                  }
                } else {
                  // Decrement until we get there
                  for (let i = commandWindow._number; i > numberGoal; i--) {
                    commandWindow.changeDigit(false);
                  }
                }
                // Select this number
                commandWindow.processOk();
              };
            } else if (SceneManager._scene._statusWindow &&
                SceneManager._scene._statusWindow.active &&
                !SceneManager._scene._statusWindow._actor) {
              // Selecting a user from the in-game menu
              commandWindow = SceneManager._scene._statusWindow;
              list = $gameParty.allMembers().map((partyMember) => {
                return {
                  name: partyMember._name,
                  symbol: partyMember._name,
                };
              });
              handler = (_, symbolIndex) => {
                commandWindow.select(symbolIndex);
                commandWindow.processOk();
              };
            } else if (SceneManager._scene._actorWindow &&
                SceneManager._scene._actorWindow.active) {
              // Selecting a user from a menu
              commandWindow = SceneManager._scene._actorWindow;
              list = $gameParty.allMembers().map((partyMember) => {
                return {
                  name: partyMember._name,
                  symbol: partyMember._name,
                };
              });
              handler = (_, symbolIndex) => {
                commandWindow.select(symbolIndex);
                commandWindow.processOk();
              };
            } else if (SceneManager._scene._inputWindow &&
                SceneManager._scene._inputWindow.active) {
              SceneManager._scene._inputWindow._editWindow._name =
                state.menu.text;
              SceneManager._scene._inputWindow.processJump();
              SceneManager._scene._inputWindow.processOk();
              return; // Exit window
            }

            let symbol;
            let symbolIndex;
            for (let i = 0; i < list.length; i++) {
              const label = list[i];
              if (label.name.toLowerCase() === state.menu.text) {
                // This is an exact match
                symbol = label.symbol;
                symbolIndex = i;
                // Exit early
                break;
              }
              if (label.name.toLowerCase().includes(state.menu.text) ||
                  state.menu.text.includes(label.name)) {
                symbol = label.symbol;
                symbolIndex = i;
              }
            }

            try {
              handler(symbol, symbolIndex);
            } catch (e) {
              console.error(e);
            }
          } else if ('index' in state.menu) {
            // Select the menu index
            const {symbol} = list[state.menu.index];
            try {
              handler(symbol);
            } catch (e) {
              console.error(e);
            }
          }
        }
        if ('open' in state) {
          /**
           * {
           *   open: A string of things that can be opened
           *     values:
           *       menu: The overworld menu
           * }
           */
          switch (state.open) {
            case 'menu':
              SceneManager._scene.callMenu();
              break;
          }
        }
        if ('command' in state) {
          /**
           * {
           *   command: A string of something that can be commanded
           *     values:
           *       close: Escape or leave a menu
           *       enter: Select or click on something in focus
           * }
           */
          const commandMap = {
            close: 'escape',
            enter: 'ok',
          };

          Input._currentState[commandMap[state.command]] = true;
          setTimeout(() => {
            Input._currentState[commandMap[state.command]] = false;
          }, 50);
        }
      },
    };
    assistantCanvas.ready(callbacks);

    const bitmapLoad = Bitmap.load;
    Bitmap.load = function(url) {
      const bitmap = bitmapLoad(url);
      bitmap._image.crossOrigin = 'anonymous';
      return bitmap;
    };

    // Move the Battle Log slightly further on page to not be obscured by banner
    BattleManager.setLogWindow = function(logWindow) {
      logWindow.y = 100; // 100px
      BattleManager._logWindow = logWindow;
      return logWindow;
    };

    console.log('Canvas loaded');
  });
})();
