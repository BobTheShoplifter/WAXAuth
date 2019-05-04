window.otp=0;
window.enabled=false;


function getsettings() {
      chrome.storage.local.get('settings', function (result) {
          var settings = result.settings;
          if (settings != undefined) {
          window.enabled = settings.autoFill == true ? true : false;
        }
      })   
};
  




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
  window.otp = four_bytes.substr(four_bytes.length - 6, 6).toString();
}

function generateOTP(type) {
  {
    chrome.storage.local.get({'requireis': []}, function (result) {
      var requireis = result.requireis;
      for(var i = 0; i < requireis.length; i++){
            OTP(requireis[i].key);
      }
    });
  }
}

function selectChange() {
  generateOTP('totp');
}

setInterval(injectCode, 1000);

function injectCode() {
  getsettings();
  if (window.enabled == false) return;
  chrome.storage.local.get({'requireis': []}, function (result) {
      var requireis = result.requireis;
      for(var i = 0; i < requireis.length; i++){
            OTP(requireis[i].key);
            if($(".two-factor-input").length){
            $(".two-factor-input").val(012345);
            }
            if($(".twofactor-input").length){
              $(".twofactor-input").val(window.otp);
              }
            if($(".twofactor-entry-code-input").length){
              $(".twofactor-entry-code-input").val(window.otp);
              }
              if($("#twoFactorCode").length){
                $("#twoFactorCode").val(window.otp);
                }
              if($("#twoFactorCodeETHCashout").length){
                  $("#twoFactorCodeETHCashout").val(window.otp);
                  }
                  if($("#twoFactorCodeBTCCashout").length){
                      $("#twoFactorCodeBTCCashout").val(window.otp);
                      }
            //$(".twofactor-entry-code-input").val(window.otp);
            //    document.querySelector("two-factor-input").value = 123
            //document.querySelector("two-factor-input").value = window.otp;
            //document.querySelector("twofactor-entry-code-input").value = otp;
        
      }
    });
  };

document.addEventListener('DOMContentLoaded', function() {
  chrome.storage.local.get({'requireis': []}, function (result) {
    var requireis = result.requireis;
    for(var i = 0; i < requireis.length; i++) {
      
    }
    generateOTP('totp');
  });
});