const {ipcRenderer} = require('electron');

let configs = {
    isOn: true,
    density: '8',
    width: '2.5',
    height: '1.5',
    unit: '1',
    host: '127.0.0.1',
    port: '9100',
    bufferSize: '4096',
    keepTcpSocket: false,
    saveLabels: false,
    filetype: '1',
    path: null,
    counter: 0,
    trayMode: 'true'
};

function configChange(field,value){
    console.log(field,value);
    configs[field] = value;
    ipcRenderer.invoke('save-config',[field,value]);
}

$(document).ready(function () {
   loadConfigs();    
});

function loadConfigs(){
    ipcRenderer.invoke('load-configs').then(data => {
        console.log(data);
        for(const item in data){
            configs[item] = data[item];
            let element = document.getElementById(item);
            element.value = configs[item];
            console.log(item,configs[item],$('#'+item).val());
        }
    });
}

function quitApp(){
    ipcRenderer.invoke('quit-app').then(data => {
    });
}

// Toggle on/off switch
// @param {Dom Object} btn Button group to toggle
function toggleSwitch(btn) {
    $(btn).find('.btn').toggleClass('active');

    if ($(btn).find('.btn-primary').size() > 0) {
        $(btn).find('.btn').toggleClass('btn-primary');
    }

    $(btn).find('.btn').toggleClass('btn-default');
}

function initDropDown(btnId, value) {
    var btn = $('#btn-' + btnId);
    var text = $('#' + btnId).find('li[aria-valuenow=' + value + '] > a').html();
    btn.attr('aria-valuenow', value);
    btn.html(text + ' <span class="caret"></span>');
}

// Prototype for string.format method
String.prototype.format = function () {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};