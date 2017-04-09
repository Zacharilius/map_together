from accounts.tests import LoginPage
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from map_together.test_util import BasePage, create_test_user
from map_room.models import MapRoom
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class CreateJoinMapRoomPage(BasePage):

    def __init__(self, browser):
        self.browser = browser

    # === Create Map Room ===

    def activate_new_maproom_tab(self):
        new_maproom_tab = self.browser.find_element_by_css_selector('#map-room-new-maproom')
        new_maproom_tab.click()

    def get_map_room_name_input(self):
        return self.browser.find_element_by_css_selector('#map-room-room-name')

    def clear_map_room_name_input(self):
        self.get_map_room_name_input().clear()

    def enter_map_room_name(self, map_room_name):
        self.get_map_room_name_input().send_keys(map_room_name)

    def get_map_room_name(self):
        return self.get_map_room_name_input().text;

    def generate_haiku_maproom_name(self):
        create_haiku_maproom_name = self.browser.find_element_by_css_selector('#map-room-new-haiku-name-button')
        create_haiku_maproom_name.click()

    def click_create_map_room_submit_button(self):
        create_map_room_submit_button = self.browser.find_element_by_css_selector('#map-room-new-submit-button')
        create_map_room_submit_button.click()

    # === Join Map Room ===

    def activate_join_maproom_tab(self):
        join_maproom_tab = self.browser.find_element_by_css_selector('#map-room-join-maproom')
        join_maproom_tab.click()

    def click_first_maproom_link(self):
        map_room_link = self.browser.find_element_by_css_selector('.map-room-link')
        map_room_link.click()


class TestCreateJoinMapRoom(StaticLiveServerTestCase):

    def setUp(self):
        self.browser = webdriver.Chrome()

        # Model Creation
        self.user = create_test_user()
        self.map_room = create_new_map_room(self.user, 'map-room-name1', 'map-room-label1')

        self.browser.get(self.live_server_url + reverse('login'))
        self.login_page = LoginPage(self.browser)
        self.login_page.login_to_maptogether('test_username', 'password')
        self.page = CreateJoinMapRoomPage(self.browser)
        self.browser.get(self.live_server_url + reverse('join_map_room'))

    def tearDown(self):
        self.browser.quit()

    def wait_for_map_room_map_to_render(self):
        wait = WebDriverWait(self.browser, 5)
        element = wait.until(EC.element_to_be_clickable((By.ID,'map-room-map')))

    def test_can_create_and_name_new_map_room(self):
        self.page.activate_new_maproom_tab()
        map_room_name = 'my-map-room-name'
        self.page.clear_map_room_name_input()
        self.page.enter_map_room_name(map_room_name)
        self.page.click_create_map_room_submit_button()

        # Map Room
        self.wait_for_map_room_map_to_render()
        assert map_room_name in self.browser.current_url


    def test_can_create_a_maproom_with_a_generated_name(self):
        self.page.activate_new_maproom_tab()
        self.page.generate_haiku_maproom_name()
        map_room_name = self.page.get_map_room_name()
        self.page.click_create_map_room_submit_button()

        # Map Room
        self.wait_for_map_room_map_to_render()
        assert map_room_name in self.browser.current_url

    def test_can_join_previously_created_map_room(self):
        self.page.activate_join_maproom_tab()
        self.page.click_first_maproom_link()
        self.wait_for_map_room_map_to_render()
        assert self.map_room.label in self.browser.current_url


class TestAnonymousUserMapRoom(StaticLiveServerTestCase):

    def setUp(self):
        self.browser = webdriver.Chrome()

        # Model Creation
        self.user = create_test_user()
        self.map_room = create_new_map_room(self.user, 'map-room-name1', 'map-room-label1')

    def tearDown(self):
        self.browser.quit()

    def test_anonymous_user_can_view_map_room(self):
        self.browser.get(self.live_server_url + reverse('map_room', kwargs={'map_room':self.map_room.label}))
        assert self.map_room.label in self.browser.current_url


class TestCreateAndEditGeoJsonInMapRoom(StaticLiveServerTestCase):

    # === Point ===

    def test_can_create_points_in_maproom_and_persisit_when_refresh_page(self):
        pass

    def test_can_edit_points_in_maproom_and_persisits_when_refresh_page(self):
        pass

    # === Line ===

    def test_can_create_lines_in_maproom_and_persisit_when_refresh_page(self):
        pass

    def test_can_edit_lines_in_maproom_and_persisits_when_refresh_page(self):
        pass

    # === Polygons ===

    def test_can_create_polygons_in_maproom_and_persisit_when_refresh_page(self):
        pass

    def test_can_edit_polygons_in_maproom_and_persisits_when_refresh_page(self):
        pass


# === Util ==

def create_new_map_room(owner, name, label):
    map_room = MapRoom(owner=owner, name=name, label=label)
    map_room.save()
    return map_room
