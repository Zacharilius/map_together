from django.contrib.auth.models import User
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

    # === Snackbar===

    def get_snackbar_text(self):
        snackbar_text = self.browser.find_element_by_css_selector('#map-together-show-snackbar .mdl-snackbar__text');
        return snackbar_text.text


def create_test_user():
    return User.objects.create_user(
        username='test_username',
        email='test@test.com',
        password='password',
        first_name='first_name',
        last_name='last_name'
    )
