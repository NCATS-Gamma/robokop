import PropTypes from 'prop-types';

const customPropTypes = {
  config: PropTypes.shape({
    protocol: PropTypes.string,
    clientHost: PropTypes.string,
    port: PropTypes.number,
  }),
  user: PropTypes.shape({
    is_authenticated: PropTypes.bool,
    is_active: PropTypes.bool,
    is_anonymous: PropTypes.bool,
    is_admin: PropTypes.bool,
    username: PropTypes.string,
  }),
};

export default customPropTypes;
