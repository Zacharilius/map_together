
$(function() {
    var form = new Forms();
    
    document.querySelector('#accounts-show-login-form').addEventListener('click', function() {
        $('button').removeClass('is-active');
        $(this).addClass('is-active');
        form.hideSignupForm();
        form.showLoginForm();
    });
    
    document.querySelector('#accounts-show-signup-form').addEventListener('click', function() {
        $('button').removeClass('is-active');
        $(this).addClass('is-active');
        form.hideLoginForm();
        form.showSignupForm();
    });
})


var Forms = function() {
    /* Login */
    var setupFailedLogin = function() {
        var isFailedLogin = window.location.search.indexOf('failed-login') != -1;
        if (isFailedLogin) {
            /* Show Failed login Error */
            $('#accounts-login-error').show();
        }
    }
    
    this.showLoginForm = function() {
        $('#accounts-form-container .accounts-login-form').fadeIn()
    }
    
    this.hideLoginForm = function() {
        $('#accounts-form-container .accounts-login-form').hide()
    }
    
    /* Logout */
   var setupSuccessfulLogout = function() {
        var isSuccessfulLogout = window.location.search.indexOf('successful-logout') != -1;
        if (isSuccessfulLogout) {
            /* Show logout Success */
            $('#accounts-logout-success').show();
        }
    }
    
    /* Signup */
    var setupFailedSignup = function() {
        var isFailedSignup = window.location.search.indexOf('failed-signup') != -1;
        if (isFailedSignup) {
            /* Show Failed signup Error */
            $('#accounts-signup-error').show();
        }
    }
    
    this.showSignupForm = function() {
        $('#accounts-form-container .accounts-signup-form').fadeIn()
    }
    
    this.hideSignupForm = function() {
        $('#accounts-form-container .accounts-signup-form').hide()
    }
    
    /* Init */
    var init = function() {
        /* Login */
        setupFailedLogin();
        setupSuccessfulLogout();
        
        /* Signup */
        setupFailedSignup();
    }
    
    init();
}
