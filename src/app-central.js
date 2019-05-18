window._views = {front: {}, left: {}, right: {}}; // all nodes, each hosts one showcase
var _order = {action: null, target: null}; // order for each showcase
window._pose = {front: null, left: null, right: null}; // latest fetched Camera.Pose

for (let v in _views){
  let width = 300, height = 280, top = window.screen.availTop;
  let left = v === 'left' ? 0 : v === 'front' ? width : width * 2;
  _views[v].features = `left=${left},top=${top},width=${width},height=${height},resizable=yes,toolbar=no,menubar=no,scrollbars=no,location=no`;
  _views[v].idle = false;
}

document.querySelectorAll('button.order').forEach((btn)=>{
  btn.onclick = function(){
    let order = btn.id.split('-');
    _order.action = order[0];
    _order.target = order[0] === 'mode' ? 'mode.' + order[1] : order[1];
    sendOrder();
  };
});

document.querySelectorAll('button.clear-log').forEach((el)=>{
  el.onclick = function(){
    document.getElementById(el.id.replace('clearLog', 'console')).innerHTML = '';
  }
});

document.getElementById('launchBtn').onclick = function(){
  for (let v in _views){
    if (_views[v].window && ! _views[v].window.closed){
      _views[v].window.close();
    }
    _views[v].window = window.open('showcase.html', v, _views[v].features);
  }
  ready();
};

document.getElementById('reloadBtn').onclick = function(){
  for (let v in _views){
    if (_views[v].window){
      _views[v].idle = false;
      _views[v].window.location.reload();
    }
  }
};

document.getElementById('quitBtn').onclick = function(){
  for (let v in _views){
    if (_views[v].window && ! _views[v].window.closed){
      _views[v].window.close();
    }
  }
  window.location.reload();
};

document.getElementById('clearConsolesBtn').onclick = function(){
  document.querySelectorAll('div .console').forEach((el)=>{
    el.innerHTML = '';
  });
};

function sendOrder(){
  for (let v in _views){
    _views[v].idle = false;
    if (_views[v].window && ! _views[v].window.closed){
      _views[v].window.postMessage(_order, window.location.origin);
    }
  }
  return ready();
}

// Promise to be resolved only after all nodes finish current assigned order
function ready(){
  return new Promise ((resolve)=>{
    let readyInterval = setInterval(()=>{
      // Prevent new order from being sent before all nodes have finished
      // the last assigned order
      document.querySelectorAll('button').forEach((btn)=>{
        btn.disabled = true;
      });
      let done = true;
      for (let v in _views){
        if (! _views[v].idle){
          done = false;
          break;
        }
      }
      if (done){
        clearInterval(readyInterval);
        document.querySelectorAll('button').forEach((btn)=>{
          btn.disabled = false;
        });
        resolve();
      }
    }, 200);
  });
}
