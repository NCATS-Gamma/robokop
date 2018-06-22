import logging
import logging.handlers
import os

# create formatter
formatter = logging.Formatter("[%(asctime)s: %(levelname)s/%(name)s(%(processName)s)]: %(message)s")

# create console handler and set level to info
console_handler = logging.StreamHandler() #"ext://sys.stdout")
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(formatter)

# create file handler and set level to debug
file_handler = logging.handlers.RotatingFileHandler(f"{os.environ['ROBOKOP_HOME']}/logs/manager.log",
    mode="a",
    encoding="utf-8",
    maxBytes=1e6,
    backupCount=9)
file_handler.setLevel(logging.DEBUG)
file_handler.setFormatter(formatter)

# create smtp handler and set level to error
smtp_handler = logging.handlers.SMTPHandler(mailhost=(os.environ["ROBOKOP_MAIL_SERVER"], 587),
                                            fromaddr=os.environ["ROBOKOP_DEFAULT_MAIL_SENDER"],
                                            toaddrs=os.environ['ADMIN_EMAIL'],
                                            subject="ROBOKOP error log",
                                            credentials=[os.environ["ROBOKOP_MAIL_USERNAME"], os.environ["ROBOKOP_MAIL_PASSWORD"]])
smtp_handler.setLevel(logging.ERROR)
smtp_handler.setFormatter(formatter)

# create logger
logger = logging.getLogger('manager')
logger.setLevel(logging.DEBUG)
logger.addHandler(console_handler)
logger.addHandler(file_handler)
logger.addHandler(smtp_handler)
