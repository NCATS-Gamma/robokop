export default function ensureUser(user) {
  const defaultUser = {
    is_authenticated: false,
    is_active: false,
    is_anonymous: true,
    is_admin: false,
    username: 'Anonymous',
    user_id: '',
  };
  return { ...defaultUser, ...user };
}
