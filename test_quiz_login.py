"""
Tests for the quiz.html login feature.
Uses Python's standard library only — no external dependencies required.

Run with:
    python3 test_quiz_login.py
"""

import re
import unittest
from pathlib import Path

HTML = Path(__file__).parent / "quiz.html"


def read_html():
    return HTML.read_text()


class LoginHTMLStructureTests(unittest.TestCase):
    """Verify the login screen markup is present and correct."""

    def setUp(self):
        self.html = read_html()

    def test_login_screen_exists(self):
        self.assertIn('id="login-screen"', self.html)

    def test_username_input_exists(self):
        self.assertIn('id="username"', self.html)

    def test_password_input_exists(self):
        self.assertIn('id="password"', self.html)

    def test_password_field_is_type_password(self):
        # Ensures the password field masks input
        match = re.search(r'id="password"', self.html)
        self.assertIsNotNone(match)
        # Find the input tag containing id="password"
        tag_start = self.html.rfind('<input', 0, match.start())
        tag_end = self.html.find('>', tag_start)
        tag = self.html[tag_start:tag_end]
        self.assertIn('type="password"', tag)

    def test_login_button_calls_login_function(self):
        self.assertIn('onclick="login()"', self.html)

    def test_login_error_element_exists(self):
        self.assertIn('id="login-error"', self.html)

    def test_start_screen_starts_hidden(self):
        # After adding login, start-screen must begin hidden
        match = re.search(r'id="start-screen"[^>]*>', self.html)
        self.assertIsNotNone(match)
        tag = match.group(0)
        self.assertIn('hidden', tag)

    def test_login_screen_is_not_hidden_initially(self):
        match = re.search(r'id="login-screen"[^>]*>', self.html)
        self.assertIsNotNone(match)
        tag = match.group(0)
        self.assertNotIn('hidden', tag)


class LoginJavaScriptTests(unittest.TestCase):
    """Verify the login() JS function contains the correct logic."""

    def setUp(self):
        self.html = read_html()
        # Extract the login function body
        start = self.html.find('function login()')
        self.assertNotEqual(start, -1, "login() function not found in script")
        # Grab text from function start to the closing brace
        brace_depth = 0
        i = start
        for i, ch in enumerate(self.html[start:], start):
            if ch == '{':
                brace_depth += 1
            elif ch == '}':
                brace_depth -= 1
                if brace_depth == 0:
                    break
        self.login_fn = self.html[start:i + 1]

    def test_login_function_exists(self):
        self.assertIn('function login()', self.html)

    def test_correct_username_checked(self):
        self.assertIn("'test'", self.login_fn)

    def test_correct_password_checked(self):
        # Both username and password are 'test'; confirm two occurrences
        self.assertEqual(self.login_fn.count("'test'"), 2)

    def test_reads_username_field(self):
        self.assertIn('getElementById(\'username\')', self.login_fn)

    def test_reads_password_field(self):
        self.assertIn('getElementById(\'password\')', self.login_fn)

    def test_shows_error_on_failure(self):
        self.assertIn('login-error', self.login_fn)

    def test_hides_login_screen_on_success(self):
        self.assertIn('login-screen', self.login_fn)
        self.assertIn('hidden', self.login_fn)

    def test_shows_start_screen_on_success(self):
        self.assertIn('start-screen', self.login_fn)

    def test_enter_key_triggers_login(self):
        # Password field should support Enter-to-submit
        self.assertIn("Enter", self.html)


if __name__ == '__main__':
    unittest.main(verbosity=2)
