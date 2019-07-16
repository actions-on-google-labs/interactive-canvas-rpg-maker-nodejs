# Actions on Google Canvas Plugin for RPG Maker
This is a JavaScript plugin for [RPG Maker MV](http://www.rpgmakerweb.com/products/programs/rpg-maker-mv)
which makes it easy to incorporate support for the Google Assistant with a zero-configuration
plugin.

This repository also includes a sample game that can be used to quickly get started.

## Setup
### Setup Plugin
* Clone this project and
* Download the file `https://www.gstatic.com/assistant/interactivecanvas/api/interactive_canvas.min.js` to `/path/to/my-game/js/libs/canvas.js`
* Copy the file `canvas-plugin.js` to `/path/to/my-game/js/plugins/canvas-plugin.js`
* Open **RPG Maker** > **Plugins**
    * Select an empty row. A window will open.
    * Select **Canvas** from the dropdown
    * Select **OK**
* Go to **File** > **Deployment...**
    * Select **Web browsers** as the platform
    * Set the _Output directory_ to the same directory as your project
    * Select **OK**
    * Rename the game folder to `www`

Your game will be saved to the specified file location.

### Setup Actions on Google project
1. From the [Actions on Google Console](https://console.actions.google.com/), add a new project > **Create Project** > under **More options** > **Conversational**
1. From the top menu under **Deploy** > **Directory information** (left nav)
    1. Under **Category**, select **Games & fun**
    1. Under **Interactive Canvas** *Do your Actions use Interactive Canvas?*, check **Yes**
1. From the left menu under **Develop** > **Actions** > **Add your first action** > **Play game** > **GET STARTED IN DIALOGFLOW** (this will bring you to the Dialogflow console) > Select language and time zone > **CREATE**.
1. In the Dialogflow console, go to **Settings** ⚙ > **Export and Import** > **Restore from zip** using the `agent.zip` in this sample's directory.

### Firebase Deployment
1. On your local machine, in the `functions` directory, run `npm install`
1. Run `firebase deploy --project {PROJECT_ID}` to deploy the function and hosting
    + This will upload functions from the `functions` directory, and your game files from the `www` directory
    + To find your **Project ID**: In [Dialogflow console](https://console.dialogflow.com/) under **Settings** ⚙ > **General** tab > **Project ID**.

### Dialogflow Console
1. Return to the [Dialogflow Console](https://console.dialogflow.com) > select **Fulfillment** > **Enable** Webhook > Set **URL** to the **Function URL** that was returned after the deploy command > **SAVE**.
    ```
    Function URL (dialogflowFirebaseFulfillment): https://${REGION}-${PROJECT_ID}.cloudfunctions.net/dialogflowFirebaseFulfillment
    ```
1. From the left navigation menu, click **Integrations** > **Integration Settings** under Google Assistant > Enable **Auto-preview changes** >  **Test** to open the Actions on Google simulator then say or type `Talk to my test app`.

# LICENSE
See `LICENSE`
