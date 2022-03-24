const { app, BrowserWindow, Tray, ipcMain} = require('electron');
const net = require('net');
const path = require('path');

const icon = path.join(__dirname,'/icons/icon-16-white.png');

// Global variable that holds the app window 
let win
let tray;
// required for regedit lib in electron

app.on('ready', ()=>{
    createWindow();
    createTray();
})

const createTray = () => {
    tray = new Tray(icon)
    tray.on('right-click', toggleWindow)
    tray.on('double-click', toggleWindow)
    tray.on('click', function (event) {
      toggleWindow()
  
      // Show devtools when command clicked
      if (win.isVisible() && process.defaultApp && event.metaKey) {
        win.openDevTools({mode: 'detach'})
      }
    })
  }

const getWindowPosition = () => {
  console.log(win);
    //const windowBounds = win.getBounds()
    const trayBounds = tray.getBounds()

    // Center window horizontally below the tray icon
    const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

    // Position window 4 pixels vertically below the tray icon
    const y = Math.round(trayBounds.y + trayBounds.height + 4)

    return {x: x, y: y}
}
  

function createWindow() {
    console.log('here');
    // Creating the browser window 
    win = new BrowserWindow({
        width: 375,
        height: 768,
        show: true,
        frame: true,
        fullscreenable: false,
        resizable: false,
        transparent: true,
        webPreferences: {
            nodeIntegration: true,
            backgroundThrottling: false
            //preload: `${__dirname}/print.js`
        }
    });

    //win.setIcon(icon);

    win.loadFile('go.html');
    
    win.on('blur', () => {
        if (!win.webContents.isDevToolsOpened()) {
          //win.hide()
        }
      })
}

const toggleWindow = () => {
    if(!win.webContents.isDevToolsOpened() && win.isVisible()) {
      //win.hide()
    } else {
      showWindow()
    }
  }
  
const showWindow = () => {
    // const position = getWindowPosition()
    // win.setBounds({ x: 440, y: 225, width: 800, height: 600 })
    // win.setPosition(position.x, position.y, false)
    //win.show()
    win.focus()
}




ipcMain.handle('get-my-key', async () => {
    return new Promise(resolve => {
       resolve('test');
    });
})




const server = net.createServer();
let PORT = 9100;
let HOST = '127.0.0.1';
server.listen(PORT, HOST);

let sockets = [];

server.on('connection', function(sock) {
    sock.setEncoding('utf8');
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    sockets.push(sock);

    sock.on('data', function(data) {
        win.webContents.send('receiveData' , data);
        //showWindow()
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
