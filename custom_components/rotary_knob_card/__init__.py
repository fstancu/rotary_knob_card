import logging

_LOGGER = logging.getLogger(__name__)

async def async_setup(homeassistant):
    """Set up the rotary knob card component."""
    _LOGGER.info("Rotary Knob Card integration successfully loaded")
    return True
