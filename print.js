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
    counter: 0
};

function configChange(field,e){
    configs[field] = e.target.value;
}

var pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/pdf.worker.js';

var elID = 0;
var url = null;
$(function () {
    $(window).bind('focus blur', function () {
        $('#panel-head').toggleClass("panel-heading-blur");
    });
});

$(document).ready(function () {
    initEvents();    
});


//ipcRenderer.invoke('get-my-key').then(result => setKey(result));

ipcRenderer.on('receiveData' , async function(event , data){
    data = data.replace(/\\n/g, '').replace(/^"(.*)"$/, '$1');
    var factor = 1;
    var width = parseFloat(configs.width) / factor;
    var height = parseFloat(configs.height) / factor;

    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'http://api.labelary.com/v1/printers/{0}dpmm/labels/{1}x{2}/'.format(configs.density, width, height), true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.setRequestHeader("Accept", "application/pdf");

    xhr.responseType = 'blob';
    xhr.onload = function (e) {
        if (this.status == 200) {
            var blob = this.response;
            if (configs['saveLabels']) {
                if (configs['filetype'] == '1') {
                    saveLabel(blob, 'pdf');
                }
            }

            window.URL.revokeObjectURL(url);

            var url = window.URL.createObjectURL(blob);
            /* start */
            
            //
            // Asynchronous download PDF
            //
            var loadingTask = pdfjsLib.getDocument(url);
            console.log('start');
            loadingTask.promise.then(async function(pdf) {

                var size = getSize(width, height);
                var sectionId = makeid(6);
                await addLabelElements(sectionId,pdf.numPages,size);

                let textProcessor = [];

                for(let i=1;i<=pdf.numPages;i++){
                    console.log('page ' + i);
                    await pdf.getPage(i).then(function(page) {
                        var pageNum = i;
                        /* element stuff */
                
                        /* PDF page Stuff */
                        var scale = 1.5;
                        var viewport = page.getViewport({ scale: scale});
                    
                        //
                        // Prepare canvas using PDF page dimensions
                        //
                        var canvas = document.getElementById('id_'+ sectionId + '_' + pageNum);
                        var context = canvas.getContext('2d');
                        //canvas.height = viewport.height;
                        //canvas.width = viewport.width;
                    
                        //
                        // Render PDF page into canvas context
                        //
                        var renderContext = {
                            canvasContext: context,
                            viewport: viewport,
                        };
                        
                        var renderTask = page.render(renderContext);

                        renderTask.promise.then(function() {
                            // Returns a promise, on resolving it will return text contents of the page
                            return page.getTextContent();
                        }).then(function(textContent){
                            console.log('render ' +pageNum);
                            var textLayer = document.getElementById("text_id_"+ sectionId + '_' + pageNum);
                            var rendered = document.getElementById('id_'+ sectionId + '_' + pageNum);
                            console.log(rendered.offsetLeft); 
                            textLayer.style.left = rendered.offsetLeft + 'px';
                            textLayer.style.top = rendered.offsetTop + 'px';
                            textLayer.style.height = rendered.offsetHeight + 'px';
                            textLayer.style.width = rendered.offsetWidth + 'px';
                        
                            // Pass the data to the method for rendering of text over the pdf canvas.
                            pdfjsLib.renderTextLayer({
                                textContent: textContent,
                                container: textLayer,
                                viewport: viewport,
                                textDivs: []
                            });
                        })
                    });
                    
                }

                var offset = ((size.height/1.5) + 20) * pdf.numPages;
                $('#sectionContainer-'+sectionId).css({'opacity':1});
                $('#label').css({ "top": '-' + offset + 'px' });
                $('#label').animate({ "top": "0px" },200*pdf.numPages,function(){
                    $('#sectionContainer-'+sectionId+' .textLayer span').on('click',function(){ 
                        selectText($(this)[0]);
                        notify('Copied','scissors','success');
                    });
                });
            });
        }
    };
    xhr.send(data);
});


async function addLabelElements(sectionId,pages,size){
    var sectionContainer = document.createElement('div');
    sectionContainer.setAttribute('id','sectionContainer-'+sectionId);
    sectionContainer.setAttribute('style','opacity:0');
    $('#label').prepend(sectionContainer);

    for(var i=1;i<=pages;i++){
        var id = sectionId + '_' + i;
        var labelContainer = document.createElement('div');
        labelContainer.setAttribute('style','position:relative');
        labelContainer.setAttribute('id','label_'+id);
        labelContainer.setAttribute('class','labelSection');
        labelContainer.innerHTML = '<button type="button" class="deleteLabel close" onClick="cutHide($(this).parent())"><i class="bi bi-trash"></i></button>'
        var textDiv = document.createElement('div');
        textDiv.setAttribute('id','text_id_'+(id));
        textDiv.setAttribute('class','textLayer');
        var img = document.createElement('canvas');
        img.setAttribute('height', size.height/1.5);
        img.setAttribute('width', size.width/1.5);
        img.setAttribute('class', 'thumbnail');
        img.setAttribute('id','id_'+(id));
            
        labelContainer.appendChild(img)
        labelContainer.appendChild(textDiv);
        sectionContainer.appendChild(labelContainer);
    }
    return true;
}

function getSize(width, height) {
    var defaultWidth = 386;

    var factor = width / height;
    return {
        width: defaultWidth,
        height: defaultWidth / factor
    };
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function initEvents() {

    $('#btn-remove').click(function () {
        var size = $('.labelSection').length;

        if (size > 0) {
            var label = size == 1 ? 'label' : 'labels';
            bootbox.confirm('Are you sure to remove {0} {1}?'.format(size, label), function (result) {
                if (result) {
                    $('.labelSection').remove();
                    notify('Removed','trash','danger');
                }
            });
        }
    });

    /*for(const item in configs){
        $('#')
    }*/


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


function selectText(node) {
    //node = document.getElementById(node);

    if (document.body.createTextRange) {
        const range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
        document.execCommand("copy");
        range.removeAllRanges();
    } else if (window.getSelection) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand("copy");
        selection.removeRange(range);
        
    } else {
        console.warn("Could not select text in node: Unsupported browser.");
    }
}

function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
 }

 function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

function cutHide(el) {
    el.animate({opacity: '0'}, 150, function(){
        el.animate({height: '0px'}, 150, function(){
        el.remove();
        });
    });
}

function notify(text, icon, type, delay) {
    $('.toast-body').html(`<i class="bi bi-${icon}"></i> ${text}`);
    $('.toast').attr({'class':'toast text-white bg-'+type});
    $('.toast').toast('show');
}