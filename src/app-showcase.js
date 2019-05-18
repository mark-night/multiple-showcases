
const _central = window.opener;
let _views = _central._views;
let _sdk = null;
// Make sure deployments will only be set for ONCE after showcase is ready for user
// input. However, fast interval seems to still run several times when clearInterval()
// is called, so this switch is used to make sure deployments is only set for once. (See below)
let _phaseReported = false;
let _MODE = null;
let _SWEEP = '';

document.title = window.name;

const Config = require('../config.json');
const showcaseFrame = document.getElementById('showcase');

// Matterport showcase URL parameters
// https://support.matterport.com/hc/en-us/articles/209980967-URL-Parameters
showcaseFrame.src = 'https://my.matterport.com/showcase-beta/?m=' + Config.Sid + '&play=1&tourcta=0&help=0&hl=2&ts=999999&gt=0&vr=0&vrcoll=1&qs=1&nozoom=1&title=0&mf=1&hr=0';
showcaseFrame.onload = function(){
  window.SHOWCASE_SDK.connect(showcaseFrame, Config.ApiKey, '3.0')
    .then(function(mpSdk) {
      _sdk = mpSdk;
      let phaseInterval = setInterval(()=>{
        _sdk.App.getLoadTimes()
        .then((times)=>{ // detect if showcase is ready
          if (times[_sdk.App.Phase.ERROR] !== null){
            clearInterval(phaseInterval);
            throw new Error('API initialization error!');
          }
          if (times[_sdk.App.Phase.PLAYING] !== null && ! _phaseReported){
            // Make sure following statements only be processed for once
            _phaseReported = true;
            clearInterval(phaseInterval);
            log('API initialized.');
          }
          else{
            throw '-bypass-';
          }
        })
        .then(()=>{ // try initialized to previous pose
          // showcase shall be ready here.
          // If previous pose info available, try to initialized to previous pose
          if (_central._pose[window.name]){
            let pose = _central._pose[window.name];
            if (pose.mode.indexOf('side') > 0){ // inside or outside
              log(`CMD: Sweep.moveTo('${pose.sweep}', {rotation: ${JSON.stringify(pose.rotation)}})`);
              return _sdk.Sweep.moveTo(pose.sweep, {rotation: pose.rotation});
            }
            else{ // dollhouse or floorplan
              log(`CMD: Mode.moveTo('${pose.mode}', {position: ${JSON.stringify(pose.position)}, rotation: ${JSON.stringify(pose.rotation)}})`);
              return _sdk.Mode.moveTo(pose.mode, {position: pose.position, rotation: pose.rotation});
            }
          }
        })
        .then(_sdk.Camera.getPose)
        .then((poseGet)=>{
          if (poseGet){
            _central._pose[window.name] = poseGet;
            _MODE = poseGet.mode;
            _SWEEP = _MODE.indexOf('side') > 0 ? poseGet.sweep : '';
            log(`Starting mode: ${_MODE}${_SWEEP.length > 0 ? '<br>Starting sweep: ' + _SWEEP : ''}`);
          }
        })
        .then(()=>{ // keep updating _MODE/_SWEEP to the latest value, so we can monitor ending status for every camera transition
          _sdk.on(_sdk.Camera.Event.MOVE, (newPose)=>{
            _MODE = newPose.mode;
            _SWEEP = _MODE.indexOf('side') > 0 ? newPose.sweep : '';
          });
          return orderDone(false);
        })
        .catch((e)=>{
          if ( e !== '-bypass-'){
            err(e);
          }
        });
      }, 200);
    })
    .catch((e)=>{
      err(e);
    });
}

// Dispatch order received
window.addEventListener('message', (event)=>{
  if (event.data.action && event.origin === window.location.origin){
    eval(`${event.data.action}('${event.data.target}')`);
  }
});

function move(target){
  Promise.resolve()
    .then(()=>{
      switch(_MODE){
        case 'mode.inside':
        case 'mode.outside':
          log(`CMD: Camera.moveInDirection('${target.toUpperCase()}')`);
          return _sdk.Camera.moveInDirection(target.toUpperCase()).then(orderDone);
        break;
        case 'mode.dollhouse':
        case 'mode.floorplan':
          err('Move is only implemented for mode.inside and mode.outside.');
          return orderDone(false);
        break;
      }
    })
    .catch((e)=>{
      err(e);
    });
}

function rotate(target){
  let r = {
            left  : [-40, 0],
            right : [40, 0],
            up    : [0, 20],
            down  : [0, -20]
          };
  log(`CMD: Camera.rotate(${r[target][0]}, ${r[target][1]})`);
  _sdk.Camera.rotate(r[target][0], r[target][1])
    .catch((e)=>{
      err(e);
    })
    .then(orderDone);
}

function mode(target){
  log(`CMD: Mode.moveTo('${target}')`);
  _sdk.Mode.moveTo(target)
    .catch((e)=>{
      err(e);
    })
    .then(orderDone);
}

function pose(){
  log(`CMD: Camera.getPose()`);
  _sdk.Camera.getPose()
    .then((poseGet)=>{
      _central._pose[window.name] = poseGet;
      _MODE = poseGet.mode;
      _SWEEP = _MODE.indexOf('side') > 0 ? poseGet.sweep : '';
      log(`Mode: ${poseGet.mode}`);
      log(`Position: ${JSON.stringify(poseGet.position)}`);
      log(`Rotation: ${JSON.stringify(poseGet.rotation)}`);
      let evalCmd = poseGet.mode.indexOf('side') > 0 ? `log('Sweep: ${poseGet.sweep}')` : '';
      eval(evalCmd);
      return orderDone(false);
    })
    .catch((e)=>{
      err(e);
    });
}

function orderDone(reportMode = true){
  if (reportMode){
    if (_MODE === 'mode.transitioning'){
      err(`Ending mode: ${_MODE}`);
      wait(new Date().getTime(), 3000).then(()=>{
        _views[window.name].idle = true;
      });
    }
    else{
      log(`Ending mode: ${_MODE}`);
      _views[window.name].idle = true;
    }
  }
  else{
    _views[window.name].idle = true;
  }
}
var count = 0;
function wait(start, duration){
  let waitTime = new Date().getTime() - start;
  if (waitTime < duration){
    return _sdk.Camera.getPose()
      .then((newPose)=>{
        count++;
        waitTime = new Date().getTime() - start;
        _central._pose[window.name] = newPose;
        _MODE = newPose.mode;
        _SWEEP = _MODE.indexOf('side') > 0 ? poseGet.sweep : '';
        if (_MODE !== 'mode.transitioning'){
          log(`Mode changed to ${_MODE} after ${(waitTime/1000).toFixed(3)} secs, with ${count} times of Camera.getPose() fetching.`);
          count = 0;
        }
        else{
          return wait(start, duration);
        }
      });
  }
  else{
    waitTime = new Date().getTime() - start;
    err(`Mode is still ${_MODE} after ${(waitTime/1000).toFixed(3)} secs, with ${count} times of Camera.getPose() fetching.`);
  }
}

function log(message){
  if (message.length > 0){
    let consoleEl = _central.document.getElementById(`console-${window.name}`);
    let preLogs = consoleEl.innerHTML;
    message = '<div>' + message + '</div>';
    consoleEl.innerHTML = preLogs + message;
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }
}

function err(error){
  console.error(error);
  let e = typeof(error) === 'object' ? error.stack : error;
  if (e.length > 0){
    e = `<span style="color:orangered">${e}</span>`;
    log(e);
  }
}
