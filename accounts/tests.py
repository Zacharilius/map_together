from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class BasePage():

    # === Right Nav ===

    def click_right_nav(self):
        nav_right_dropdown = self.browser.find_element_by_css_selector('#nav-right-dropdown');
        nav_right_dropdown.click()

    def click_logout(self):
        wait = WebDriverWait(self.browser, 10)
        logout_button = wait.until(EC.element_to_be_clickable((By.ID,'nav-logout-button')))
        logout_button.click()

    # === Right Nav ===

    def get_snackbar_text(self):
        snackbar_text = self.browser.find_element_by_css_selector('#map-together-show-snackbar .mdl-snackbar__text');
        return snackbar_text.text

class LoginPage(BasePage):

    def __init__(self, browser):
        self.browser = browser

    # === Signup ===

    def signup_for_maptogether(self, first_name, last_name, email, username, password):
        signup_tab = self.browser.find_element_by_css_selector('#accounts-signup-tab');
        signup_tab.click()

        first_name_input = self.browser.find_element_by_css_selector('#accounts-signup-fname')
        first_name_input.send_keys(first_name)

        last_name_input = self.browser.find_element_by_css_selector('#accounts-signup-lname')
        last_name_input.send_keys(last_name)

        email_input = self.browser.find_element_by_css_selector('#accounts-signup-email')
        email_input.send_keys(email)

        username_input = self.browser.find_element_by_css_selector('#accounts-signup-username')
        username_input.send_keys(username)

        password_input = self.browser.find_element_by_css_selector('#accounts-signup-password')
        password_input.send_keys(password)

        submit_button = self.browser.find_element_by_css_selector('#accounts-signup-submit')
        submit_button.click()
    
    # === Login ===

    def login_to_maptogether(self, username, password):
        username_input = self.browser.find_element_by_css_selector('#accounts-login-username')
        username_input.send_keys(username)

        password_input = self.browser.find_element_by_css_selector('#accounts-login-password')
        password_input.send_keys(password)

        login_submit_button = self.browser.find_element_by_css_selector('#accounts-login-submit')
        login_submit_button.click()


class TestLoginLogout(StaticLiveServerTestCase):

    def setUp(self):
        self.browser = webdriver.Chrome()
        self.browser.get(self.live_server_url + reverse('login'))
        self.page = LoginPage(self.browser)
        self.user = User.objects.create_user(
            username='test_username',
            email='test@test.com',
            password='password',
            first_name='first_name',
            last_name='last_name'
        )

    def tearDown(self):
        self.browser.quit()

    def assertOnProfilePage(self):
        assert self.browser.current_url == self.live_server_url + reverse('profile')

    def test_user_can_create_account(self):
        self.page.signup_for_maptogether('first_name', 'last_name', 'blah@email.com', 'new_username', 'password')
        self.assertOnProfilePage()

    def test_user_can_login(self):
        self.page.login_to_maptogether('test_username', 'password')
        self.assertOnProfilePage()

    def test_user_can_logout(self):
        # Login and assert on Profile Page
        self.page.login_to_maptogether('test_username', 'password')
        self.assertOnProfilePage()

        # Click Logout and assert successful logout message is visible.
        self.page.click_right_nav()
        self.page.click_logout()

        # Shows the logged out snackbar text
        snackbar_text = self.page.get_snackbar_text()
        assert snackbar_text == 'Successfully logged out!'

    def test_failed_login_redirects_to_login_and_shows_failed_login_message(self):
        self.page.login_to_maptogether('test_username', 'wrong_password')

        # Shows the logged out snackbar text
        snackbar_text = self.page.get_snackbar_text()
        assert snackbar_text == 'Login Error: Incorrect username/password combination!'

    def test_failed_signup_redirects_to_login_and_shows_failed_signup_message(self):
        # Tries to create a username that already exists in the database.
        self.page.signup_for_maptogether('first_name', 'last_name', 'test@test.com', 'test_username', 'password')

        # Shows the logged out snackbar text
        snackbar_text = self.page.get_snackbar_text()
        assert snackbar_text == 'Pick a new username, that username is already taken.'
