import { Ok } from '_lessjs/core';
import { CustomRequest } from 'src/shared/types/express';

import { UserDto } from '../user.dto';

export const deleteUser = (req: CustomRequest) => {
  console.log('deleteUser', req.body);
  const user = req.body as UserDto;

  return Ok({
    message: 'user deleted',
    data: user,
  });
};
