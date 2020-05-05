import logging
import logging.handlers
import os

def set_up_main_logger():
    """ Sets up logging for the whole application."""
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
    # logger.addHandler(smtp_handler)
    return logger

logger = set_up_main_logger()


def clear_log_handlers(logger):
    """ Clears any handlers from the logger."""
    for handler in logger.handlers:
        handler.flush()
        handler.close()
    logger.handlers = []
def add_task_id_based_handler(logger, task_id):
    """Adds a file handler with task_id as file name to the logger."""
    formatter = logging.Formatter("[%(asctime)s: %(levelname)s/%(name)s(%(processName)s)]: %(message)s")
    # create file handler and set level to debug
    file_handler = logging.handlers.RotatingFileHandler(f"{os.environ['ROBOKOP_HOME']}/logs/manager_task_logs/{task_id}.log",
        mode="a",
        encoding="utf-8",
        maxBytes=1e6,
        backupCount=9)
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)