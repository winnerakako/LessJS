import { Dto, router } from '_lessjs/core';

import {
  UserDto,
  createUser,
  deleteUser,
  updateUser,
} from 'src/apps/first-app-v1/services/user';

export const Router = router()
  // User Registration
  .post(`/first-app-v1/users/register`, createUser, Dto(UserDto))

  .put(`/first-app-v1/users/update`, updateUser, Dto(UserDto))

  .delete(`/first-app-v1/users/delete`, deleteUser)

  .build();

export default Router;
