
var Login = function() {
    var init = function() {
        setupFailedLogin();
        setupSuccessfulLogout();
    }
    
    var setupFailedLogin = function() {
        var isFailedLogin = window.location.search.indexOf('failed-login') != -1;
        if (isFailedLogin) {
            /* Show Failed login Error */
            document.querySelector('#accounts-login-error').style.display = 'block';
        }
    }
    
    var setupSuccessfulLogout = function() {
        var isSuccessfulLogout = window.location.search.indexOf('successful-logout') != -1;
        if (isSuccessfulLogout) {
            /* Show logout Success */
            document.querySelector('#accounts-logout-success').style.display = 'block';
        }
    }
    
    init();
}

Login();
