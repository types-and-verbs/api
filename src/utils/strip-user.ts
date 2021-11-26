import { User, APIUser } from 'types';

export default function stripUser(user: User): APIUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
