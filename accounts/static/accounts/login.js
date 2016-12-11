
$(function() {
    var form = new Forms();
})


var Forms = function() {
    var showSnackBarWithMessage = function(message) {
        var data = {
              message: message,
              timeout: 10000,
            };
        document.querySelector('#map-together-show-snackbar').MaterialSnackbar.showSnackbar(data);
    }
    
    /* Login */
    var setupFailedLogin = function() {
        var isFailedLogin = window.location.search.indexOf('failed-login') != -1;
        if (isFailedLogin) {
            showSnackBarWithMessage('Login Error: Incorrect username/password combination!');
        }
    }
    
    /* Logout */
   var setupSuccessfulLogout = function() {
        var isSuccessfulLogout = window.location.search.indexOf('successful-logout') != -1;
        if (isSuccessfulLogout) {
            showSnackBarWithMessage('Successfully logged out!');
        }
    }
    
    /* Signup */
    var setupFailedSignup = function() {
        var isFailedSignup = window.location.search.indexOf('failed-signup') != -1;
        if (isFailedSignup) {
            showSnackBarWithMessage('Pick a new username, that username is already taken.');
        }
    }
    
    /* Init */
    var init = function() {
        /* Deferral: Waits for MDL to fully load before using a snackbar */
        setTimeout(function() {
            setupFailedLogin();
            setupSuccessfulLogout();
            setupFailedSignup();
        }, 0)
    }
    
    init();
}
