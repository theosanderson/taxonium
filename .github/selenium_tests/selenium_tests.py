from selenium import webdriver
from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager

driver = webdriver.Chrome(ChromeDriverManager().install())
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import sys

url = sys.argv[1]

chrome_service = Service(
    ChromeDriverManager(chrome_type=ChromeType.CHROMIUM).install())

chrome_options = Options()
options = [
    "--headless", "--disable-gpu", "--window-size=1920,1200",
    "--ignore-certificate-errors", "--disable-extensions", "--no-sandbox",
    "--disable-dev-shm-usage", "--disable-web-security"
]
for option in options:
    chrome_options.add_argument(option)

driver = webdriver.Chrome(service=chrome_service, options=chrome_options)

#driver.get('http://nytimes.com')

driver.get(url)

print(url)
print("###")
time.sleep(20)

print(driver.get_log("browser"))

if driver.find_elements_by_css_selector('#view-main'):
    print("Element exists")
else:
    raise ValueError("Could not find element")
