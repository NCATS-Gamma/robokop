import os

DEBUG = True
SECRET_KEY = 'covar-renci-ncats-secret'
DEFAULT_MAIL_SENDER = 'robokopteam@gmail.com'
SECURITY_EMAIL_SENDER = 'robokopteam@gmail.com'

db_path = os.path.join(os.path.dirname(__file__), '..', 'robokop.db')
db_uri = 'sqlite:///{}'.format(db_path)
SQLALCHEMY_DATABASE_URI = db_uri
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Security Misc
SECURITY_PASSWORD_SALT = 'covar-renci-ncats-secret-salt'

# Security views
SECURITY_LOGIN_URL = '/login' # Specifies the login URL. Defaults to /login.
SECURITY_LOGOUT_URL = '/logout' # Specifies the logout URL. Defaults to /logout.
SECURITY_REGISTER_URL = '/register' # Specifies the register URL. Defaults to /register.
SECURITY_RESET_URL = '/password/reset' # Specifies the password reset URL. Defaults to /reset.
SECURITY_CHANGE_URL = '/password/change' # Specifies the password change URL. Defaults to /change.
SECURITY_CONFIRM_URL = '/user/confirm' # Specifies the email confirmation URL. Defaults to /confirm.
SECURITY_POST_LOGIN_VIEW = '/' # Specifies the default view to redirect to after a user logs in. This value can be set to a URL or an endpoint name. Defaults to /.
SECURITY_POST_LOGOUT_VIEW = '/' # Specifies the default view to redirect to after a user logs out. This value can be set to a URL or an endpoint name. Defaults to /.
SECURITY_CONFIRM_ERROR_VIEW = None # Specifies the view to redirect to if a confirmation error occurs. This value can be set to a URL or an endpoint name. If this value is None, the user is presented the default view to resend a confirmation link. Defaults to None.
# SECURITY_UNAUTHORIZED_VIEW = '/unauthorized' # Specifies the view to redirect to if a user attempts to access a URL/endpoint that they do not have permission to access. If this value is None, the user is presented with a default HTTP 403 response. Defaults to None.

# Security Templates
SECURITY_FORGOT_PASSWORD_TEMPLATE = 'security/forgot_password.html' # Specifies the path to the template for the forgot password page. Defaults to security/forgot_password.html.
SECURITY_LOGIN_USER_TEMPLATE = 'security/login_user.html' # Specifies the path to the template for the user login page. Defaults to security/login_user.html.
SECURITY_REGISTER_USER_TEMPLATE = 'security/register_user.html' # Specifies the path to the template for the user registration page. Defaults to security/register_user.html.
SECURITY_RESET_PASSWORD_TEMPLATE = 'security/reset_password.html' # Specifies the path to the template for the reset password page. Defaults to security/reset_password.html.
SECURITY_CHANGE_PASSWORD_TEMPLATE = 'security/change_password.html' # Specifies the path to the template for the change password page. Defaults to security/change_password.html.
SECURITY_SEND_CONFIRMATION_TEMPLATE = 'security/send_confirmation.html' # Specifies the path to the template for the resend confirmation instructions page. Defaults to security/send_confirmation.html.
SECURITY_SEND_LOGIN_TEMPLATE = 'security/send_login.html' # Specifies the path to the template for the send login instructions page for passwordless logins. Defaults to security/send_login.html.

# Security Options
SECURITY_CONFIRMABLE = True # Specifies if users are required to confirm their email address when registering a new account. If this value is True, Flask-Security creates an endpoint to handle confirmations and requests to resend confirmation instructions. The URL for this endpoint is specified by the SECURITY_CONFIRM_URL configuration option. Defaults to False.
SECURITY_REGISTERABLE = True # Specifies if Flask-Security should create a user registration endpoint. The URL for this endpoint is specified by the SECURITY_REGISTER_URL configuration option. Defaults to False.
SECURITY_RECOVERABLE = True # Specifies if Flask-Security should create a password reset/recover endpoint. The URL for this endpoint is specified by the SECURITY_RESET_URL configuration option. Defaults to False.
SECURITY_CHANGEABLE = True # Specifies if Flask-Security should enable the change password endpoint. The URL for this endpoint is specified by the SECURITY_CHANGE_URL configuration option. Defaults to False.

# Security Email settings
SECURITY_EMAIL_SUBJECT_REGISTER = 'Robokop - Please confirm your email' # Sets the subject for the confirmation email. Defaults to Welcome
SECURITY_EMAIL_SUBJECT_PASSWORD_NOTICE = 'Robokop - Your password has been reset' # Sets subject for the password notice. Defaults to Your password has been reset
SECURITY_EMAIL_SUBJECT_PASSWORD_RESET = 'Robokop - Password Reset Instructions' # Sets the subject for the password reset email. Defaults to Password reset instructions
SECURITY_EMAIL_SUBJECT_PASSWORD_CHANGE_NOTICE = 'Robokop - Your password has been changed' # Sets the subject for the password change notice. Defaults to Your password has been changed
SECURITY_EMAIL_SUBJECT_CONFIRM = 'Robokop - Please confirm your email' # Sets the subject for the email confirmation message. Defaults to Please confirm your email

# Mail Setup
MAIL_SERVER = 'smtp.gmail.com'
MAIL_PORT = 465
MAIL_USE_TLS = False
MAIL_USE_SSL = True
MAIL_USERNAME = 'robokopteam@gmail.com'
MAIL_PASSWORD = '!!!super_secret_password!!!'
