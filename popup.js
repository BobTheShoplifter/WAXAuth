var settings = {
  autoFill:null,
  streamerMode:null
};
window.loadedatofill = false;
window.streamermode=false;
window.currentcode="";



function errNotif(msg) {
  $( "#errorMsg" ).html(msg);
  document.getElementById('errorMsg').style.visibility = 'visible';
  setTimeout(function(){ document.getElementById('errorMsg').style.visibility = 'hidden'; }, 3000);
}
function dec2hex(s) {
  return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
}

function hex2dec(s) {
  return parseInt(s, 16);
}
function isBase32(key) {
  var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  key = key.replace(/\s/g,'');
  key = key.toUpperCase();
  for (var i = 0; i < key.length; i++) {
    if (base32chars.indexOf(key[i]) == -1) {
      return null;
    }
  }
  if (key.length !=16) {
    return null;
  }
  return key;
}
function base32decode(strToDecode) {
  var base32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  var bits = "";
  var hex = "";
  for (var i = 0; i < strToDecode.length; i++) {
      var val = base32.indexOf(strToDecode.charAt(i));
      bits += padding(val.toString(2), 5);
  }
  for (var i = 0; i+4 <= bits.length; i+=4) {
      var chunk = bits.substr(i, 4);
      hex = hex + parseInt(chunk, 2).toString(16) ;
  }
  return hex;
}

function padding(str, len) {
  if (len + 1 >= str.length) {
      str = Array(len + 1 - str.length).join('0') + str;
  }
  return str;
}

function OTP(original_secret) {
  var secret = base32decode(original_secret);
  var epoch = Math.round(new Date().getTime() / 1000.0);
  var input = padding(dec2hex(Math.floor(epoch / 30)), 16);
  var shaObj = new jsSHA("SHA-1", "HEX");
  shaObj.setHMACKey(secret, "HEX");
  shaObj.update(input);
  var hmac = shaObj.getHMAC("HEX");
  var last_byte = hex2dec(hmac.substring(hmac.length - 1));
  var four_bytes = (hex2dec(hmac.substr(last_byte * 2, 8)) & 0x7fffffff) + '';
  otp = four_bytes.substr(four_bytes.length - 6, 6).toString();
  window.currentcode=otp;
  if (window.streamermode == true) {
  $( "#totpa" ).html("XXX XXX");
  }else if (window.streamermode == false) {
  $( "#totpa" ).html(otp);
  }
}


function loadsettings() {
  chrome.storage.local.get('settings', function (result) {
      var settings = result.settings;
      window.loadedatofill = settings.autoFill;
      window.streamermode = settings.streamerMode;
      $("#autofill").val(window.loadedatofill);
      $("#streamer").val(window.streamermode);
      if (settings.autoFill == true) {
        $("#autofill").prop('checked', true);
      }else if (settings.autoFill == false) {
        $("#autofill").prop('checked', false);
      }
      if (settings.streamerMode == true) {
        $("#streamer").prop('checked', true);
      }else if (settings.streamerMode == false) {
        $("#streamer").prop('checked', false);
      }
  })   
};


function savesettings() {
var value = false;
var value2 = false;
if ($("#autofill").val() == "true") {value = true}
else if ($("#autofill").val() == "false") {value = false}
if ($("#streamer").val() == "true") {value2 = true; $( "#totpa" ).html("XXX XXX");}
else if ($("#streamer").val() == "false") {value2 = false; $( "#totpa" ).html(window.currentcode);}
settings.autoFill=value
settings.streamerMode=value2
window.streamermode=value2
chrome.storage.local.set({'settings': settings}
  );
};


loadsettings();

function loop()
{
  var epoch = Math.round(new Date().getTime() / 1000.0);
  var progressVal = Math.trunc(((epoch % 30) * 100) / 30);
  document.getElementById("myBar").style.width = progressVal + '%';
  if (progressVal > 85) document.getElementById("myBar").style.backgroundColor = '#164a77';
  else if (progressVal > 60) document.getElementById("myBar").style.backgroundColor = '#2776ba';
  else document.getElementById("myBar").style.backgroundColor = '#337ab7';
  if (epoch % 30 == 0) generateOTP('totp');
  //var tab = chrome.tabs.getCurrent(null, function (tab) {
    //if (tab.url.indexOf('totp') != -1) {
      //document.getElementById('injection').style.visibility = 'visible';
    //}
  //})
}

function updateSelect(name) {
  var select = document.getElementById('chooseProfile');
  var opt = document.createElement('option');
  $(opt).html(name);
  opt.value = name;
  select.appendChild(opt);
}


function generateOTP(type) {
  var select = document.getElementById('chooseProfile');
  if (select.options[select.selectedIndex] != undefined)
  {
    document.getElementById('myProgress').style.visibility = 'visible';
    var label = select.options[select.selectedIndex].text;
    $('#activename').html(label);
    chrome.storage.local.get({'requireis': []}, function (result) {
      var requireis = result.requireis;
      for(var i = 0; i < requireis.length; i++){
        if (requireis[i].name === label) {
          if (type === 'totp') {
            OTP(requireis[i].key);
          }
        }
      }
    });
  }
  else {
    document.getElementById('myProgress').style.visibility = 'hidden';
    $( "#totpa" ).html("--- ---")
  }
}



function addUser() {
  chrome.storage.local.get({'requireis': []}, function (result) {
    var requireis = result.requireis;
    for (var i = 0; i < requireis.length; i++) {
      if (requireis[i].name == document.getElementById('username').value) {
        errNotif('User name aleready used');
        return ;
      }
    }
    var key = isBase32(document.getElementById('userkey').value);
    if (key == null) {
      errNotif('Wrong key format');
      return ;
    }
    requireis.push({'name': document.getElementById('username').value, 'key': key});
    chrome.storage.local.set({'requireis': requireis}, function () {
      updateSelect(document.getElementById('username').value);
      selectChange();
      document.getElementById('username').value = "";
      document.getElementById('userkey').value = "";
    });
  });
}

function delUser() {
  var select = document.getElementById('chooseProfile');
  var label = select.options[select.selectedIndex].text;
  chrome.storage.local.get({'requireis': []}, function (result) {
    var requireis = result.requireis;
    for(var i = 0; i < requireis.length; i++){
    	if (requireis[i].name === label) requireis.splice(i, 1);
    }
    chrome.storage.local.set({'requireis': requireis}, function () {
      for(var i = 0; i < select.options.length; i++){
      	if (select.options[i].text === label) select.options[i].remove();
      }
      selectChange();
    });
  });
}

function selectChange() {
  generateOTP('totp');
}



function injectCode() {
  let otp = window.currentcode;
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
    var id = tabs.id;
    //Checking Tabs
    chrome.tabs.executeScript(id, {
        code: 'var elementExists = document.querySelector(".two-factor-input"); if (elementExists != null) {elementExists.value = \'' + otp + '\'; $(".two-factor-input")[0].dispatchEvent(new Event("change", {bubbles: true}))}'
    });
      chrome.tabs.executeScript(id, {
      code: 'var elementExists = document.querySelector(".twofactor-input"); if (elementExists != null) {elementExists.value = \'' + otp + '\'; $(".twofactor-input")[0].dispatchEvent(new Event("change", {bubbles: true}))}'
  });
  chrome.tabs.executeScript(id, {
    code: 'var elementExists = document.querySelector(".onsite-txt-offer"); if (elementExists != null) {elementExists.value = \'' + otp + '\'; $(".onsite-txt-offer")[0].dispatchEvent(new Event("change", {bubbles: true}))}'
});
  chrome.tabs.executeScript(id, {
    code: 'var elementExists = document.getElementById("twoFactorCodeETHCashout"); if (elementExists != null) {elementExists.value = \'' + otp + '\';}' 
});
chrome.tabs.executeScript(id, {
  code: 'var elementExists = document.getElementById("twoFactorCodeBTCCashout"); if (elementExists != null) {elementExists.value = \'' + otp + '\';}' 
});
chrome.tabs.executeScript(id, {
  code: 'var elementExists = document.getElementById("twoFactorCode"); if (elementExists != null) {elementExists.value = \'' + otp + '\'; $("#twoFactorCode")[0].dispatchEvent(new Event("change", {bubbles: true}))};' 
});
chrome.tabs.executeScript(id, {
  code: 'var elementExists = document.getElementById("code"); if (elementExists != null) {elementExists.value = \'' + otp + '\'; $("#code")[0].dispatchEvent(new Event("change", {bubbles: true}))};' 
});
    chrome.tabs.executeScript(id, {
      code: 'var elementExists = document.querySelector(".twofactor-entry-code-input"); if (elementExists != null) {elementExists.value = \'' + otp + '\'; $(".twofactor-entry-code-input")[0].dispatchEvent(new Event("change", {bubbles: true}))}'
  });
  });
}

function showmodal(){
  var modal = document.getElementById('myModal');
  modal.style.display = "block";
  modal.style.animation = "movement .5s forwards normal 1";
};

window.onload = function(){
  var modal = document.getElementById('myModal'); 
  var span = document.getElementsByClassName("close")[0];
  span.onclick = function() {
  modal.style.animation = "movement2 .5s forwards normal 1";
  setTimeout(function() {
    modal.style.display =  "none"
  }, 750);
}
};


window.onclick = function(event) {
  var modal = document.getElementById('myModal');
  if (event.target == modal) {
    modal.style.animation = "movement2 .5s forwards normal 1";
    setTimeout(function() {
      modal.style.display =  "none"
    }, 750);
  }
}

  function autofillclick() {
    if ($("#autofill").val() == "true") {$("#autofill").val("false")}
    else if ($("#autofill").val() == "false") {$("#autofill").val("true")}
  }

  function streamerclick() {
    if ($("#streamer").val() == "true") {$("#streamer").val("false")}
    else if ($("#streamer").val() == "false") {$("#streamer").val("true")}
  }

  function copyToClipboard(element) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(window.currentcode).select();
    document.execCommand("copy");
    $temp.remove();
  }

  function opentutorial() {
      chrome.tabs.create({url: $(this).attr('href')});
      return false;
    };
  



document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('errorMsg').style.visibility = 'hidden';
  var select = document.getElementById('chooseProfile');
  chrome.storage.local.get({'requireis': []}, function (result) {
    var requireis = result.requireis;
    for(var i = 0; i < requireis.length; i++) {
      var opt = document.createElement('option');
      $(opt).html(requireis[i].name);
      opt.value = requireis[i].name;
      select.appendChild(opt);
    }
    document.getElementById('adduser').addEventListener("click", addUser);
    document.getElementById('settings').addEventListener("click", showmodal);
    document.getElementById('add-user').addEventListener("click", showmodal);
    document.getElementById('deluser').addEventListener("click", delUser);
    document.getElementById('injection').addEventListener("click", injectCode);
    document.getElementById('save').addEventListener("click", savesettings);
    document.getElementById('chooseProfile').addEventListener("change", selectChange);
    document.getElementById('autofill').addEventListener("click", autofillclick);
    document.getElementById('streamer').addEventListener("click", streamerclick);
    document.getElementById('copycode').addEventListener("click", copyToClipboard);
    document.getElementById('tutorial').addEventListener("click", opentutorial);
    generateOTP('totp');
    setInterval(loop, 500);
  });
});
