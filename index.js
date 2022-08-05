const { resolve } = require('dns');
const { app, BrowserWindow, screen, Menu, Tray, ipcMain} = require('electron');
const net = require('net');
const path = require('path');
const config = require('electron-json-config').factory();

const icon = path.join(__dirname,'/icons/icon-16-white.png');

// Global variable that holds the app window 
let win
let settingWin;

let display
let width = 0;
let height = 0;
let startingTop = 0;
let openXpos
let closedXpos
let windowWidth
let windowHeight
let trayMode = config.get('trayMode') === "false" ? false : true;

// required for regedit lib in electron
if(process.platform === "linux") {
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.disableHardwareAcceleration();
}

app.on('ready', ()=>{
  setTimeout(function() {
    createWindow();
  },500);
    //createTray();


// const menu = new Menu()
// const menuItem = new MenuItem({
//   label: 'Inspect Element',
//   click: () => {
//     remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)
//   }
// })
// menu.append(menuItem)
    

})

// const createTray = () => {
//     tray = new Tray(icon)
//     tray.on('right-click', toggleWindow)
//     tray.on('double-click', toggleWindow)
//     tray.on('click', function (event) {
//       toggleWindow()
  
//       // Show devtools when command clicked
//       if (win.isVisible() && process.defaultApp && event.metaKey) {
//         win.openDevTools({mode: 'detach'})
//       }
//     })
//   }

const getWindowPosition = () => {
    //const windowBounds = win.getBounds()
    //const trayBounds = tray.getBounds()

    // Center window horizontally below the tray icon
    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

    // Position window 4 pixels vertically below the tray icon
    const y = Math.round(trayBounds.y + trayBounds.height + 4)

    return {x: x, y: y}
}
  

function createWindow() {
    console.log('here');
    const displays = screen.getAllDisplays()

    for(let i=0;i < displays.length; i++){
      let display = displays[i];

      width += display.bounds.width;
      height = display.bounds.height;
      startingTop = display.workArea.y;
    }
    // const externalDisplay = displays.find((display) => {
    //   console.log(display.bounds);
    //   return display.bounds.x !== 0 || display.bounds.y !== 0
    // })

    // if (externalDisplay) {
    //  display = externalDisplay;
    // }
    // else display = screen.getPrimaryDisplay();
    // width = display.bounds.width;
    // height = display.bounds.height;
    windowWidth = 375;
    windowHeight = height - 40;
    openXpos = width-373;
    closedXpos = width-3;

    // Creating the browser window 
    win = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        show: false,
        frame: trayMode ? false : true,
        fullscreenable: false,
        resizable: trayMode ? false : true,
        transparent: trayMode ? true : false,
        focusable: trayMode ? false : true,
        alwaysOnTop: true,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            backgroundThrottling: false
            //preload: `${__dirname}/print.js`
        }
    });

    //win.openDevTools({mode: 'detach'})
    

    
    //win.setIcon(icon);

    win.loadFile('go.html');
    showWindow();
    if(trayMode) setTimeout(hideWindow,1000)
    //win.webContents.openDevTools({mode:'undocked'})
    
    win.on('blur', () => {
        if (!win.webContents.isDevToolsOpened()) {
          
        }
      })

    //win.openDevTools({mode: 'detach'})
}



const toggleWindow = () => {
    if(!win.webContents.isDevToolsOpened() && win.isVisible()) {
      //win.hide()
    } else {
      showWindow()
    }
  }
  
const showWindow = () => {
    win.setBounds({
      width: windowWidth,
      height: windowHeight,
      x: openXpos,
      y: startingTop+30
    });
   
    win.show()
    win.focus()
}

const hideWindow = () => {
    win.setBounds({
      width: windowWidth,
      height: windowHeight,
      x: closedXpos,
      y: startingTop + 30
    });

    win.show()
    win.focus()
}

ipcMain.handle('load-configs', async () => {
    return new Promise(resolve => {
      //console.log('leave');
      resolve(config.all());
    });
})


ipcMain.handle('leave-window', async () => {
    return new Promise(resolve => {
      console.log('leave');
      if(trayMode)hideWindow();
      resolve(true);
    });
})


ipcMain.handle('enter-window', async () => {
    return new Promise(resolve => {
      //console.log('enter');
      if(trayMode)showWindow();
      resolve(true);
    });
})

ipcMain.handle('show-settings', async () => {
    
  
    return new Promise(resolve => {
      settingWin = new BrowserWindow({
        show: false,
        frame: true,
        fullscreenable: false,
        resizable: true,
        transparent: false,
        focusable: true,
        alwaysOnTop: false,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            backgroundThrottling: false
            //preload: `${__dirname}/print.js`
        }
    });

    settingWin.loadFile('settings.html');
    settingWin.show();
    settingWin.focus();
      
    resolve(true);
  });
})

ipcMain.handle('save-config', async (event,data) => {
  console.log(data);
  return new Promise(resolve => {
      config.set(data[0],data[1]);
      if(data[0] == 'trayMode' || data[0] == 'host' || data[0] == 'port'){
        app.relaunch();
        app.exit(0);  
      }
      resolve(true); 
    });
})

ipcMain.handle('quit-app', async () => {
  app.exit(0)
})



const server = net.createServer();
let PORT = config.get('port') ? config.get('port') : 9100;
let HOST = config.get('host') ? config.get('host') : '127.0.0.1';
server.listen(PORT, HOST);

let sockets = [];

server.on('connection', function(sock) {
    sock.setEncoding('utf8');
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    sockets.push(sock);

    sock.on('data', function(data) {
        win.webContents.send('receiveData' , data);
        if(trayMode) showWindow()
    });

    // Add a 'close' event handler to this instance of socket
    sock.on('close', function(data) {
        let index = sockets.findIndex(function(o) {
            return o.remoteAddress === sock.remoteAddress && o.remotePort === sock.remotePort;
        })
        if (index !== -1) {
            sockets.splice(index, 1);
        }
        console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
    });
});

console.log('Server listening on ' + HOST +':'+ PORT);
