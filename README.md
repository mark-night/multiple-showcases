This branch is a very basic simplified app to show issues will occur with multiple showcases setup.

Follow README guide in original starter-kit (see below) to setup the environment and load the dev-server (sudo npm run debug). Don't forget to put in your api key in config.json, then visit 127.0.0.1:800 to start the app. (My api key is blocked on port 80, so I make dev-server to run on port 800.)

#### Please allow window popup from localhost/127.0.0.1 to let the app run correctly. This app is meant to be run in Google Chrome, other browsers may be OK but have not been tested.

Please note that, interactions with showcases are supposed to be done via clicking buttons on central window.
All buttons on page are pretty self-explained, so I'll just skip explaining them one by one. Codes are commented in detail, check them out if interested.

### Tests worth doing

#### 1. Toggle mode
Every camera transition updates current pose that are stored in global variables. Reading those variables in a .then() chained after movement Promise shall get the "ending pose" for each camera movement.
Notice how ending mode is often 'mode.transitioning', if not everytime, particularly when toglling to mode of DOLLHOUSE or FLOORPLAN. 
A shortly delayed Camera.getPose() (e.g. a Camera.getPose() in a second .then()) ussually (but not always) get correct mode info.
As the result, trying to move camera in a .then() chained right after a Mode.moveTo() often fails due to "another transition is active", or sometime it will succeed (as there will be a short delay in between), unpredictable and undetectable. 

#### 2. Reloading showcases (via "Reload Showcases" button of course)
Move to some pose other than the default start location, then click "Reload Showcases".
As in my observation, I'll suggest to load some model with a start location in mode of INSIDE or OUTSIDE, then move to some pose in mode of DOLLHOUSE or FLOORPLAN, and then try "Reload Showcases". For most of the times, this will fail. While reloading from mode of INSIDE/OUTSIDE seems to work for most of the times, but not all the time neither. Checking error log in showcases' browser window console will be necessary to understand what is happening.
This seems to be related to test #1 (above), but it's actually not the same. The above one happens AFTER a movement is completed, while this one happens BEFORE a movement is started.

#### 3. Early interact
When SDK indicates showcase is ready for user input (entering appphase.playing), the showcase itself is still displaying logos. Move/Rotate/Mode do NOT always work before logos fade out. Even when it works, it'll be a camera pop intead of a smooth transition. There are even weird situations that showcase will only follow portion of the order, e.g. rotate roughly half of what was asked. As in my observation, it will only be safe to move camera 1-2 seconds LATER AFTER logos fade out. However, there seems no way through API to do this be cause codes can not "see" if logos fade out yet and the "1-2 seconds" is not certain.


# Original Starter-Kit README guide


This starter kit is being used for the 2019 AEC hackathon - SF Bay Area. If you would like to join the Matterport developer program please visit https://matterport.com/developers/ to sign up for sdk access.

# sdk-starter-kit

[Matterport SDK Reference](https://matterport.github.io/showcase-sdk/docs/)

#### 1. Get the latest version

```shell
$ git clone git@github.com:matterport/sdk-starter-kit.git MyApp
$ cd MyApp
```

#### 2. Install dependencies

```shell
$ npm install
```
#### 3. Configure your application settings
Open [config.json](./config.json) in your favorite text editor and replace the following strings:

`REPLACE_WITH_YOUR_MODEL_SID` and `REPLACE_WITH_YOUR_API_KEY`

You can obtain your model sid from a Matterport url, ie
https://my.matterport.com/showcase-beta?m=SxQL3iGyoDo

#### 4. Run debug web server
Depending on your system, you might not need to run npm as sudo. Note: Some Cygwin setups may create orphaned Node.exe processes when terminating webpack-dev-server.

```shell
sudo npm run debug
Password:*****

> sdk-starter-kit@1.0.0 debug /Users/guillermo/Documents/sdk-starter-kit copy
> webpack-dev-server

Project is running at http://localhost:80/
webpack output is served from /
Hash: 2a5d5b76f4f06063aac3
Version: webpack 3.11.0
Time: 638ms
    Asset    Size  Chunks                    Chunk Names
bundle.js  839 kB       0  [emitted]  [big]  main
   [2] multi (webpack)-dev-server/client?http://localhost:80 ./src/index.js 40 bytes {0} [built]
   [3] (webpack)-dev-server/client?http://localhost:80 7.91 kB {0} [built]
   [4] ./node_modules/url/url.js 23.3 kB {0} [built]
   [8] ./node_modules/querystring-es3/index.js 127 bytes {0} [built]
  [11] ./node_modules/strip-ansi/index.js 161 bytes {0} [built]
  [13] ./node_modules/loglevel/lib/loglevel.js 7.86 kB {0} [built]
  [14] (webpack)-dev-server/client/socket.js 1.08 kB {0} [built]
  [15] ./node_modules/sockjs-client/dist/sockjs.js 181 kB {0} [built]
  [16] (webpack)-dev-server/client/overlay.js 3.67 kB {0} [built]
  [17] ./node_modules/ansi-html/index.js 4.26 kB {0} [built]
  [18] ./node_modules/html-entities/index.js 231 bytes {0} [built]
  [21] (webpack)/hot nonrecursive ^\.\/log$ 170 bytes {0} [built]
  [23] (webpack)/hot/emitter.js 77 bytes {0} [built]
  [25] ./src/index.js 523 bytes {0} [built]
  [26] ./config.json 91 bytes {0} [built]
    + 12 hidden modules
webpack: Compiled successfully.

```

#### 4. Start developing your application.
Your application can begin using the Matterport SDK after a successful connection.
See [src/index.js](src/index.js) line 11

```javascript
window.SHOWCASE_SDK.connect(showcaseFrame, Config.ApiKey, '3.0')
  .then(function(sdk) {
    console.log('SDK Connected!');

    // Your Matterport SDK application starts here.
    sdk.Model.getData().then(function(modelData){
      console.log('Model data loaded for sid:', modelData.sid);
    });
  })
```

#### 5. Customize the viewer
You can customize the viewer by setting url parameters on the iframe src,

For example, 
```javascript
const showcaseFrame = document.getElementById('showcase');
showcaseFrame.src = 'https://my.matterport.com/showcase-beta?m=' + Config.Sid + '&play=1&brand=0&qs=1';
```
These options set:
<table>
    <tr><td>Option</td><td>Description</td></tr>
    <tr><td>play=1</td><td>Automatically opens the Matterport Space when the iframe loads on the page</td></tr>
    <tr><td>brand=0</td><td>Hide 'Presented By' details when Space opens.</td></tr>
    <tr><td>qs=1</td><td>Enable Quickstart (when the Matterport Space first opens, go straight into Inside View).</td></tr>
</table>

[Matterport URL Parameters Link](https://support.matterport.com/hc/en-us/articles/209980967-URL-Parameters)
